"use client";

import { useState } from "react";

import { selectTenantAction } from "@/features/auth/actions";
import { useSessionOutcome } from "@/features/auth/hooks/use-session-outcome";
import { SelectableTenant, TenantStatus } from "@/features/auth/types";

import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { LoadingButton } from "@/components/shared/loading-button";

const statusLabel: Record<TenantStatus, string> = {
    [TenantStatus.ACTIVE]: "Active",
    [TenantStatus.PENDING_APPROVAL]: "Awaiting approval",
    [TenantStatus.REJECTED]: "Not approved",
    [TenantStatus.SUSPENDED]: "Suspended",
};

type TenantPickerProps = {
    selectionToken: string;
    tenants: SelectableTenant[];
    callbackUrl?: string;
};

/** Second step when a sign-in matches several organizations; only ACTIVE ones can be entered. */
export const TenantPicker = ({ selectionToken, tenants, callbackUrl }: TenantPickerProps) => {
    const finishSession = useSessionOutcome();
    const [pendingSlug, setPendingSlug] = useState<string | null>(null);

    const onSelect = async (slug: string) => {
        setPendingSlug(slug);
        const result = await selectTenantAction(selectionToken, slug);
        setPendingSlug(null);
        finishSession(result, { callbackUrl, errorTitle: "Couldn't open organization" });
    };

    return (
        <div className="flex flex-col gap-3">
            <Text variant="small" tone="muted">
                Choose the organization you want to open.
            </Text>
            {tenants.map((tenant) => (
                <div key={tenant.slug} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="flex min-w-0 flex-col">
                        <Text variant="small" weight="medium" className="truncate">
                            {tenant.name}
                        </Text>
                        <Text variant="small" tone="muted" className="truncate">
                            {tenant.slug}
                        </Text>
                    </div>
                    {tenant.status === TenantStatus.ACTIVE ? (
                        <LoadingButton
                            size="sm"
                            isLoading={pendingSlug === tenant.slug}
                            disabled={pendingSlug !== null}
                            onClick={() => onSelect(tenant.slug)}
                        >
                            Open
                        </LoadingButton>
                    ) : (
                        <Badge variant="secondary">{statusLabel[tenant.status]}</Badge>
                    )}
                </div>
            ))}
        </div>
    );
};
