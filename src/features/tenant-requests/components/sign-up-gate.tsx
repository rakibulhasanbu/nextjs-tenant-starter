"use client";

import { useTenantRequestConfig } from "@/features/tenant-requests/api";

import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { LinkButton } from "@/components/shared/link-button";

/** Shows the sign-up form only while the platform allows self signup; otherwise points at the request form. */
export const SignUpGate = ({ children }: { children: React.ReactNode }) => {
    const { data: config, isLoading } = useTenantRequestConfig();

    if (isLoading) return <Skeleton className="h-96 w-full" />;
    if (!config || config.selfSignupEnabled) return <>{children}</>;

    return (
        <div className="flex flex-col items-start gap-3">
            <Text variant="small" tone="muted">
                {config.registrationRequestEnabled
                    ? "New organizations are set up by our team. Send a request and we'll invite you once it's approved."
                    : "New organizations are not being accepted right now."}
            </Text>
            {config.registrationRequestEnabled && <LinkButton href="/register">Request access</LinkButton>}
        </div>
    );
};
