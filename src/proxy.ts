import { NextRequest, NextResponse } from "next/server";

import { canViewDashboard, hasPermission, PERMISSIONS, User } from "@/features/auth/types";

import { parseHost } from "@/lib/host";

export const ROUTES = {
    // Requires a signed-in user on a tenant host.
    protectedRoutes: ["/dashboard", "/account"] as const,
    // Subset of protectedRoutes that additionally requires a dashboard permission.
    adminOnlyRoutes: ["/dashboard"] as const,
    // Super admin console, platform host only.
    platformRoutes: ["/platform"] as const,
    auth: [
        "/auth/sign-in",
        "/auth/forgot-password",
        "/auth/verify-email",
        "/auth/2fa-verify",
        "/auth/reactivate-account",
    ] as const,
    // Apex only: creating an organization (a tenant host is already one).
    onboarding: ["/auth/sign-up", "/register"] as const,
    // Reachable by anyone on any host: they run *before* a session exists, or explain why none can.
    open: ["/auth/exchange", "/auth/organization-status", "/accept-invite"] as const,
};

export const isRouteMatched = (pathname: string, routes: readonly string[]) =>
    routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

export const isRouteExactMatched = (pathname: string, routes: readonly string[]) =>
    routes.some((route) => pathname === route);

export async function proxy(req: NextRequest) {
    const { pathname, searchParams, search } = req.nextUrl;
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    const { kind } = parseHost(host);

    if (isRouteMatched(pathname, ROUTES.open)) return NextResponse.next();

    const hasSession = hasSessionCookies(req);
    const user = hasSession ? readUser(req) : undefined;

    // Sessions are per host. The apex never holds one — sign-in there hands off to the organization's host.
    if (kind === "apex") return handleApex(req, pathname, search);

    const isPlatformHost = kind === "platform";
    // The console only exists for the super admin; a stale cookie from anything else is treated as signed out.
    const isAuthenticated =
        hasSession && (!isPlatformHost || hasPermission(user?.permissions, PERMISSIONS.PLATFORM_TENANT_READ));
    const home = isPlatformHost ? "/platform/tenants" : canViewDashboard(user?.permissions) ? "/dashboard" : "/account";

    if (pathname === "/") {
        return isAuthenticated ? redirectTo(home, req) : redirectTo("/auth/sign-in", req);
    }

    // Creating an organization makes no sense from inside one (or from the console).
    if (isRouteMatched(pathname, ROUTES.onboarding)) return redirectTo("/auth/sign-in", req);

    if (isRouteMatched(pathname, ROUTES.auth)) {
        if (!isAuthenticated) return NextResponse.next();
        const callback = searchParams.get("callbackUrl");
        // Only follow same-site paths; a callbackUrl is attacker-controllable.
        return redirectTo(callback?.startsWith("/") && !callback.startsWith("//") ? callback : home, req);
    }

    if (isRouteMatched(pathname, ROUTES.platformRoutes)) {
        if (!isPlatformHost) return redirectTo("/", req);
        return isAuthenticated ? NextResponse.next() : redirectTo(signInUrl(pathname, search), req);
    }

    if (isRouteMatched(pathname, ROUTES.protectedRoutes)) {
        if (!isAuthenticated) return redirectTo(signInUrl(pathname, search), req);
        // The console has no organization dashboard; /account (the super admin's own profile) is shared.
        if (isPlatformHost && isRouteMatched(pathname, ROUTES.adminOnlyRoutes)) return redirectTo(home, req);
        if (isRouteMatched(pathname, ROUTES.adminOnlyRoutes) && !canViewDashboard(user?.permissions)) {
            return redirectTo("/account", req);
        }
    }

    return NextResponse.next();
}

const handleApex = (req: NextRequest, pathname: string, search: string) => {
    const needsHost =
        isRouteMatched(pathname, ROUTES.protectedRoutes) || isRouteMatched(pathname, ROUTES.platformRoutes);

    return needsHost ? redirectTo(signInUrl(pathname, search), req) : NextResponse.next();
};

const signInUrl = (pathname: string, search: string) =>
    `/auth/sign-in?callbackUrl=${encodeURIComponent(pathname + search)}`;

function redirectTo(path: string, req: NextRequest): NextResponse {
    const url = new URL(path, req.url);

    return url.pathname === req.nextUrl.pathname ? NextResponse.next() : NextResponse.redirect(url);
}

// NOTE: this proxy only redirects for UX — it trusts cookie *presence* and the
// unsigned `user` JSON cookie for permissions, neither of which it can
// cryptographically verify. It is NOT an authorization boundary. Every
// privileged backend endpoint MUST independently verify the JWT and
// re-derive the permissions server-side; never rely on this gate alone.
const hasSessionCookies = (req: NextRequest) =>
    !!req.cookies.get("accessToken")?.value && !!req.cookies.get("refreshToken")?.value;

const readUser = (req: NextRequest): User | undefined => {
    const raw = req.cookies.get("user")?.value;
    if (!raw) return undefined;
    try {
        return JSON.parse(raw) as User;
    } catch {
        return undefined;
    }
};

// Matcher configuration - exclude static files and API routes
export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
