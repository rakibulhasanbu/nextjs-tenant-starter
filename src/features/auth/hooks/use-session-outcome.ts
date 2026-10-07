"use client";

import { useRouter } from "next/navigation";

import { isTenantStateError, SessionTenant, User } from "@/features/auth/types";
import { useAuthStore } from "@/store/auth-store";

import { toast } from "@/components/ui/toast";

type SessionOutcome =
    | {
          status: "success";
          data: { accessToken: string; refreshToken: string; tenant: SessionTenant | null; user: User };
      }
    | { status: "redirect"; url: string }
    | { status: "signInRequired" };

type ErrorOutcome = { status: "error"; error: string; code?: string; reason?: string };

/** Where a blocked organization state is explained (pending approval, rejected, suspended...). */
export const organizationStatusUrl = (code: string, reason?: string) => {
    const params = new URLSearchParams({ code });
    if (reason) params.set("reason", reason);
    return `/auth/organization-status?${params.toString()}`;
};

/**
 * What every sign-in-shaped step (password, 2FA, email verify, reset, invite,
 * exchange) does with a finished server action: store the session here, or — when
 * the sign-in happened on the apex — continue on the organization's own host.
 */
export const useSessionOutcome = () => {
    const router = useRouter();
    const setTokens = useAuthStore((state) => state.setTokens);
    const setUser = useAuthStore((state) => state.setUser);
    const setTenant = useAuthStore((state) => state.setTenant);

    /** Returns true when the outcome ended the flow (success, redirect, or a status screen). */
    return (outcome: SessionOutcome | ErrorOutcome, { callbackUrl = "/", errorTitle = "Sign in failed" } = {}) => {
        if (outcome.status === "error") {
            if (isTenantStateError(outcome.code)) {
                router.replace(organizationStatusUrl(outcome.code, outcome.reason));
                return true;
            }
            toast.add({ title: errorTitle, description: outcome.error, type: "error" });
            return false;
        }

        if (outcome.status === "signInRequired") {
            toast.add({
                title: "You're verified",
                description: "Sign in to choose an organization.",
                type: "success",
            });
            router.replace("/auth/sign-in");
            return true;
        }

        if (outcome.status === "redirect") {
            window.location.assign(outcome.url);
            return true;
        }

        setTokens({ accessToken: outcome.data.accessToken, refreshToken: outcome.data.refreshToken });
        setUser(outcome.data.user);
        setTenant(outcome.data.tenant);

        router.replace(callbackUrl);
        router.refresh();
        return true;
    };
};
