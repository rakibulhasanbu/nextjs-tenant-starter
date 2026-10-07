export const API_VERSION = "v1";

/**
 * Must mirror the backend's `JWT_REFRESH_TTL` (default `30d`). The cookies are
 * only carriers — the backend is what enforces expiry — but if this window is
 * shorter, users are signed out while their refresh token is still valid.
 */
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.NEXT_PUBLIC_REFRESH_TOKEN_TTL_DAYS ?? 30);

export const config = {
    /** The API's own origin (apex host). Tenant/platform pages mirror their host onto it — see `lib/api-base.ts`. */
    serverOrigin: process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3000",
    /** Mirrors the backend's `APP_ROOT_DOMAIN`: tenants live at `<slug>.<rootDomain>`. */
    rootDomain: (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost").toLowerCase(),
    /** Mirrors the backend's `PLATFORM_SUBDOMAIN`: the super admin console. */
    platformSubdomain: (process.env.NEXT_PUBLIC_PLATFORM_SUBDOMAIN ?? "admin").toLowerCase(),
    refreshTokenTtlDays: Number.isFinite(REFRESH_TOKEN_TTL_DAYS) ? REFRESH_TOKEN_TTL_DAYS : 30,
};
