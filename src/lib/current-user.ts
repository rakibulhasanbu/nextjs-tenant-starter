"server-only";

import { User } from "@/features/auth/types";

import type { ApiSuccessResponse } from "@/lib/api-types";
import { getAccessTokenCookie, getUserCookie } from "@/lib/auth-cookies";
import { getServerApiBase } from "@/lib/server-host";

/**
 * `/users/me` — the only endpoint that returns `permissions[]` and `maxRank`
 * alongside the profile, which is what server-side gates check.
 */
export const fetchMe = async (accessToken: string): Promise<User | null> => {
    const response = await fetch(`${await getServerApiBase()}/users/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
    });
    if (!response.ok) return null;
    const json = (await response.json()) as ApiSuccessResponse<User>;
    return json.data;
};

/**
 * The caller as the backend sees them *right now*, for server components that
 * gate on it. The `user` cookie is a snapshot written at sign-in and rewritten
 * on every token refresh, so it can lag a role change by up to one access-token
 * lifetime — long enough for a suspended admin to keep seeing the dashboard.
 *
 * Falls back to that cookie when the access token has already expired: an RSC
 * cannot refresh tokens (it may not write cookies), and the api client will do
 * it on the next request. That window is exactly why this is a UX gate and not
 * an authorization boundary — every privileged endpoint re-checks server-side.
 */
export const getCurrentUser = async (): Promise<User | undefined> => {
    const accessToken = await getAccessTokenCookie();
    if (!accessToken) return undefined;

    return (await fetchMe(accessToken)) ?? (await getUserCookie());
};
