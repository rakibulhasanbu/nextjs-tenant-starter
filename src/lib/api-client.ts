import { useAuthStore } from "@/store/auth-store";

import { getClientApiBaseUrl } from "@/lib/api-base";
import { type ApiErrorResponse, type ApiSuccessResponse, type Method, type QueryParams } from "@/lib/api-types";
import { toast } from "@/components/ui/toast";

export type { QueryParams } from "@/lib/api-types";

export const API_TIMEOUT = 120_000; // 2 minutes

export const METHOD = {
    POST: "POST",
    GET: "GET",
    PUT: "PUT",
    PATCH: "PATCH",
    DELETE: "DELETE",
} as const;

export class ApiError extends Error {
    status: number;
    code: string;
    details?: unknown[];

    constructor(body: ApiErrorResponse) {
        super(body.message || "Something went wrong");
        this.status = body.statusCode;
        this.code = body.code;
        this.details = body.details;
    }
}

type RequestOptions = {
    method?: Method;
    body?: unknown;
    params?: QueryParams;
    headers?: Record<string, string>;
    /** Internal: skips auth header + 401 refresh handling (used for the refresh call itself). */
    skipAuth?: boolean;
};

const buildUrl = (endpoint: string, params?: QueryParams) => {
    // `new URL(endpoint, base)` treats a leading-slash endpoint as absolute and
    // discards the base's own path (e.g. the `/api` in API_BASE_URL) — concatenate instead.
    const path = `${getClientApiBaseUrl().replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;
    const url = new URL(path, typeof window !== "undefined" ? window.location.origin : undefined);

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value === undefined) return;
            if (Array.isArray(value)) {
                value.forEach((v) => url.searchParams.append(key, v));
            } else {
                url.searchParams.set(key, String(value));
            }
        });
    }

    return url.toString();
};

const rawFetch = async (endpoint: string, options: RequestOptions = {}) => {
    const { method = METHOD.GET, body, params, headers, skipAuth } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const authHeaders: Record<string, string> = {};
    if (!skipAuth) {
        const token = useAuthStore.getState().accessToken;
        if (token) authHeaders.Authorization = `Bearer ${token}`;
    }

    try {
        const response = await fetch(buildUrl(endpoint, params), {
            method,
            body: body !== undefined ? JSON.stringify(body) : undefined,
            headers: {
                "Content-Type": "application/json",
                ...authHeaders,
                ...headers,
            },
            signal: controller.signal,
        });

        const data = await response.json().catch(() => null);

        return { response, data };
    } finally {
        clearTimeout(timeoutId);
    }
};

// Ensures concurrent 401s trigger a single refresh call; all callers await the same promise.
let refreshPromise: Promise<boolean> | null = null;

const refreshAccessToken = async (): Promise<boolean> => {
    if (!refreshPromise) {
        refreshPromise = (async () => {
            const refreshToken = useAuthStore.getState().refreshToken;

            if (!refreshToken) {
                await useAuthStore.getState().logout();
                return false;
            }

            const { response, data } = await rawFetch("/auth/refresh", {
                method: METHOD.POST,
                body: { refreshToken },
                skipAuth: true,
            });

            if (response.ok && data) {
                // Refresh tokens rotate server-side — the old one is revoked as soon as
                // it's consumed, so we must persist the newly issued one, not reuse the old.
                const result = data as ApiSuccessResponse<{ accessToken: string; refreshToken: string }>;
                await useAuthStore.getState().setTokensAndRevalidate({
                    accessToken: result.data.accessToken,
                    refreshToken: result.data.refreshToken,
                });
                return true;
            }

            await useAuthStore.getState().logoutWithReload();
            toast.add({ title: "Session expired" });
            return false;
        })().finally(() => {
            refreshPromise = null;
        });
    }

    return refreshPromise;
};

const requestEnvelope = async (endpoint: string, options: RequestOptions = {}) => {
    let { response, data } = await rawFetch(endpoint, options);

    if (response.status === 401 && !options.skipAuth) {
        const refreshed = await refreshAccessToken();

        if (refreshed) {
            ({ response, data } = await rawFetch(endpoint, options));
        }
    }

    if (!response.ok) {
        throw new ApiError(
            (data as ApiErrorResponse) ?? {
                statusCode: response.status,
                code: "UNKNOWN_ERROR",
                message: "Something went wrong",
            }
        );
    }

    // 204 No Content responses have no envelope to unwrap.
    return data as ApiSuccessResponse<unknown> | null;
};

export const apiFetch = async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
    const envelope = await requestEnvelope(endpoint, options);
    return (envelope ? envelope.data : null) as T;
};

/** For endpoints that return `{ data: T[], meta: { page, limit, total } }` (e.g. `GET /admin/users`) — returned as-is. */
export const apiFetchPaginated = async <T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<ApiSuccessResponse<T[]>> => {
    const envelope = await requestEnvelope(endpoint, options);
    return envelope as ApiSuccessResponse<T[]>;
};
