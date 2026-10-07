"use server";

import {
    AuthResponse,
    SelectableTenant,
    SessionTenant,
    SignInResult,
    TenantSelectionResponse,
    User,
} from "@/features/auth/types";

import type { ApiErrorResponse, ApiSuccessResponse } from "@/lib/api-types";
import { clearAuthCookies, getRefreshTokenCookie, setAuthCookies } from "@/lib/auth-cookies";
import { fetchMe } from "@/lib/current-user";
import { getRequestHostKind, getServerApiBase } from "@/lib/server-host";

const AUTH_ENDPOINTS = {
    register: "/auth/signup",
    login: "/auth/signin",
    logout: "/auth/logout",
    verifyEmail: "/auth/verify-email",
    resendVerification: "/auth/resend-verification",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    google: "/auth/google",
    twoFactorLoginVerify: "/auth/2fa/login-verify",
    reactivateAccount: "/auth/reactivate-account",
    selectTenant: "/auth/select-tenant",
    switchTenant: "/auth/switch-tenant",
    exchange: "/auth/exchange",
    acceptInvite: "/auth/accept-invite",
} as const;

type ActionError = {
    status: "error";
    error: string;
    code?: string;
    graceEndsAt?: string;
    /** `TENANT_REJECTED` carries the reviewer's reason. */
    reason?: string;
    /** Tenant-state errors carry the caller's organizations, so the client can offer another one. */
    tenants?: SelectableTenant[];
};

type SessionData = { user: User } & AuthResponse;

/** A finished sign-in either lives on this host, or must continue on the organization's own host. */
type SessionOutcome =
    | { status: "success"; data: SessionData }
    | { status: "redirect"; url: string }
    /** The account verified fine but matches several organizations — only a password sign-in can pick one. */
    | { status: "signInRequired" };

type BackendResult<T> = { ok: true; data: T } | ({ ok: false } & Omit<ActionError, "status">);

/** Raw POST against the backend — every server action below is this call with a different endpoint/body/headers. */
const backendRequest = async <T>(
    endpoint: string,
    body: unknown,
    extraHeaders?: Record<string, string>
): Promise<BackendResult<T>> => {
    try {
        const response = await fetch(`${await getServerApiBase()}${endpoint}`, {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                ...extraHeaders,
            },
        });

        // 204 No Content endpoints have no JSON body to parse.
        const json = response.status === 204 ? null : await response.json().catch(() => null);

        if (!response.ok) {
            const { message, code, graceEndsAt, reason, tenants } = (json as ApiErrorResponse) ?? {};
            return {
                ok: false,
                error: message || "Something went wrong",
                code,
                // Only `ACCOUNT_PENDING_DELETION` carries this; it is the
                // deadline after which the account cannot be restored.
                graceEndsAt: typeof graceEndsAt === "string" ? graceEndsAt : undefined,
                reason: typeof reason === "string" ? reason : undefined,
                tenants: Array.isArray(tenants) ? (tenants as SelectableTenant[]) : undefined,
            };
        }

        const data = json === null ? null : (json as ApiSuccessResponse<T>).data;
        return { ok: true, data: data as T };
    } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "Something went wrong" };
    }
};

const toError = ({
    error,
    code,
    graceEndsAt,
    reason,
    tenants,
}: Extract<BackendResult<unknown>, { ok: false }>): ActionError => ({
    status: "error",
    error,
    code,
    graceEndsAt,
    reason,
    tenants,
});

/** Login/register-with-Google both return tokens only (no user) — fetch `/users/me` and persist the session. */
const establishSession = async (tokens: AuthResponse): Promise<SessionOutcome | ActionError> => {
    const user = await fetchMe(tokens.accessToken);
    if (!user) {
        return { status: "error", error: "Signed in, but couldn't load your profile. Try again." };
    }
    await setAuthCookies({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user,
        tenant: tokens.tenant,
    });
    return { status: "success", data: { ...tokens, user } };
};

/**
 * Sessions are per host: an organization's tokens only make sense on its own
 * subdomain. A sign-in that happened on the apex therefore trades its freshly
 * minted token for a one-time exchange code and sends the browser to the
 * organization's host, where `/auth/exchange` redeems it — no token ever travels
 * in a URL, and nothing is stored on the apex.
 */
const handoffToTenant = async (
    tokens: AuthResponse & { tenant: SessionTenant }
): Promise<SessionOutcome | ActionError> => {
    const switched = await backendRequest<{ exchangeCode: string }>(
        AUTH_ENDPOINTS.switchTenant,
        { tenantSlug: tokens.tenant.slug },
        { Authorization: `Bearer ${tokens.accessToken}` }
    );

    // The apex session was only a stepping stone; drop it whatever happened.
    await backendRequest(AUTH_ENDPOINTS.logout, { refreshToken: tokens.refreshToken });

    if (!switched.ok) return toError(switched);

    const url = new URL("/auth/exchange", tokens.tenant.url);
    url.searchParams.set("code", switched.data.exchangeCode);
    return { status: "redirect", url: url.toString() };
};

const completeLogin = async (tokens: AuthResponse | TenantSelectionResponse): Promise<SessionOutcome | ActionError> => {
    if ("tenantSelectionRequired" in tokens) return { status: "signInRequired" };
    if (tokens.tenant && (await getRequestHostKind()) === "apex") {
        return handoffToTenant({ ...tokens, tenant: tokens.tenant });
    }
    return establishSession(tokens);
};

export const loginAction = async (email: string, password: string, tenantSlug?: string) => {
    const result = await backendRequest<SignInResult>(AUTH_ENDPOINTS.login, {
        email,
        password,
        tenantSlug: tenantSlug || undefined,
    });
    if (!result.ok) return toError(result);

    // 2FA-enabled accounts get a short-lived token to complete the challenge instead of tokens directly.
    if ("twoFactorRequired" in result.data && result.data.twoFactorRequired) {
        return { status: "twoFactorRequired", twoFactorToken: result.data.twoFactorToken } as const;
    }

    // Several usable organizations: the client shows a picker and finishes with `selectTenantAction`.
    if ("tenantSelectionRequired" in result.data && result.data.tenantSelectionRequired) {
        return {
            status: "tenantSelection",
            selectionToken: result.data.selectionToken,
            tenants: result.data.tenants,
        } as const;
    }

    return completeLogin(result.data as AuthResponse);
};

export const selectTenantAction = async (selectionToken: string, tenantSlug: string) => {
    const result = await backendRequest<AuthResponse>(AUTH_ENDPOINTS.selectTenant, { selectionToken, tenantSlug });
    if (!result.ok) return toError(result);
    return completeLogin(result.data);
};

/** Redeems the one-time code a sign-in or org switch put in the URL, on the organization's own host. */
export const exchangeCodeAction = async (code: string) => {
    const result = await backendRequest<AuthResponse>(AUTH_ENDPOINTS.exchange, { code });
    if (!result.ok) return toError(result);
    return establishSession(result.data);
};

/** The emailed invite link's token names the tenant, so only the token and a new password are sent. */
export const acceptInviteAction = async (token: string, password: string) => {
    const result = await backendRequest<AuthResponse>(AUTH_ENDPOINTS.acceptInvite, { token, password });
    if (!result.ok) return toError(result);
    return completeLogin(result.data);
};

interface Login2faVerifyActionProps {
    twoFactorToken: string;
    code?: string;
    recoveryCode?: string;
    deviceType?: string;
    deviceName?: string;
}

/** Consumes the intermediate 2FA token plus a TOTP code or recovery code, then signs the user in. */
export const login2faVerifyAction = async ({
    twoFactorToken,
    code,
    recoveryCode,
    deviceType,
    deviceName,
}: Login2faVerifyActionProps) => {
    const result = await backendRequest<AuthResponse>(AUTH_ENDPOINTS.twoFactorLoginVerify, {
        twoFactorToken,
        code,
        recoveryCode,
        deviceType,
        deviceName,
    });
    if (!result.ok) return toError(result);
    return completeLogin(result.data);
};

interface RegisterActionProps {
    name: string;
    email: string;
    phone?: string;
    password: string;
    tenantName: string;
    tenantSlug: string;
}

/** Registration creates the account *and* its organization; it does not log the user in — they verify their email first. */
export const registerAction = async ({ name, email, phone, password, tenantName, tenantSlug }: RegisterActionProps) => {
    const result = await backendRequest<{ user: User; tenant: SessionTenant }>(AUTH_ENDPOINTS.register, {
        name,
        email,
        phone: phone || undefined,
        password,
        tenantName,
        tenantSlug,
    });
    if (!result.ok) return toError(result);
    return { status: "success", data: result.data } as const;
};

/**
 * Undoes a self-deletion while the account is still inside its grace period.
 * The code is not requested from here — the backend mails it automatically when
 * sign-in, sign-up or Google login hits a deleted account and answers 409
 * `ACCOUNT_PENDING_DELETION`, which is what routes the user to this screen.
 */
export const reactivateAccountAction = async (email: string, code: string) => {
    const result = await backendRequest<null>(AUTH_ENDPOINTS.reactivateAccount, { email, code });
    if (!result.ok) return { status: "error", error: result.error } as const;
    return { status: "success", data: null } as const;
};

/** Consumes the 6-digit code emailed to the user, then signs them in — proving the code is proof of ownership. */
export const verifyEmailAction = async (email: string, code: string, tenantSlug?: string) => {
    const result = await backendRequest<AuthResponse | TenantSelectionResponse>(AUTH_ENDPOINTS.verifyEmail, {
        email,
        code,
        tenantSlug: tenantSlug || undefined,
    });
    if (!result.ok) return toError(result);
    return completeLogin(result.data);
};

export const resendVerificationAction = async (email: string) => {
    const result = await backendRequest<null>(AUTH_ENDPOINTS.resendVerification, { email });
    if (!result.ok) return { status: "error", error: result.error } as const;
    return { status: "success", data: null } as const;
};

export const forgotPasswordAction = async (email: string) => {
    const result = await backendRequest<null>(AUTH_ENDPOINTS.forgotPassword, { email });
    if (!result.ok) return { status: "error", error: result.error } as const;
    return { status: "success", data: null } as const;
};

/** Consumes the 6-digit code emailed to the user, then signs them in — proving the code is proof of ownership. */
export const resetPasswordAction = async ({
    email,
    code,
    password,
    tenantSlug,
}: {
    email: string;
    code: string;
    password: string;
    tenantSlug?: string;
}) => {
    const result = await backendRequest<AuthResponse | TenantSelectionResponse>(AUTH_ENDPOINTS.resetPassword, {
        email,
        code,
        password,
        tenantSlug: tenantSlug || undefined,
    });
    if (!result.ok) return toError(result);
    return completeLogin(result.data);
};

/** `newTenant` is only needed the first time a Google identity signs up — it names the organization to create. */
export const loginWithGoogleAction = async (idToken: string, newTenant?: { name: string; slug: string }) => {
    const result = await backendRequest<AuthResponse>(AUTH_ENDPOINTS.google, { idToken, newTenant });
    if (!result.ok) return toError(result);
    return completeLogin(result.data);
};

export const logoutAction = async () => {
    const refreshToken = await getRefreshTokenCookie();
    if (refreshToken) {
        await backendRequest(AUTH_ENDPOINTS.logout, { refreshToken });
    }
    await clearAuthCookies();
};

/**
 * Called after the api client rotates tokens. The `user` cookie is refreshed
 * along with them: it carries the roles and permissions both `proxy.ts` and the
 * dashboard layout gate on, and leaving it untouched meant a revoked role or a
 * suspension did not reach the client gate until the next sign-in.
 *
 * A failed `/users/me` leaves the old snapshot in place rather than signing the
 * user out — the tokens themselves are fresh, and the api client will surface
 * any real authorization change on its next call.
 */
export const revalidateTokensAction = async (accessToken: string, refreshToken: string) => {
    const user = await fetchMe(accessToken);
    await setAuthCookies({ accessToken, refreshToken, user: user ?? undefined });
    return user;
};
