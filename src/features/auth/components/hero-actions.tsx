"use client";

import { canViewDashboard as hasDashboardAccess } from "@/features/auth/types";
import { useAuthStore } from "@/store/auth-store";
import { ArrowRightIcon } from "lucide-react";

import { Text } from "@/components/ui/text";
import { LinkButton } from "@/components/shared/link-button";

export const HeroActions = () => {
    const user = useAuthStore((state) => state.user);

    if (user) {
        const displayName = user.name || user.username;
        const canViewDashboard = hasDashboardAccess(user.permissions);

        return (
            <div className="flex flex-col items-start gap-4">
                <Text variant="lead" tone="muted" className="max-w-md text-base sm:text-lg">
                    Welcome back, {displayName.split(" ")[0]}.
                </Text>
                <LinkButton
                    href={canViewDashboard ? "/dashboard" : "/account"}
                    size="lg"
                    className="bg-brand text-brand-foreground hover:bg-brand/90"
                >
                    {canViewDashboard ? "Go to dashboard" : "View your account"}
                    <ArrowRightIcon />
                </LinkButton>
            </div>
        );
    }

    return (
        <div className="flex flex-wrap items-center gap-3">
            <LinkButton href="/auth/sign-up" size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
                Create your organization
                <ArrowRightIcon />
            </LinkButton>
            <LinkButton href="/auth/sign-in" variant="outline" size="lg">
                Sign in
            </LinkButton>
        </div>
    );
};
