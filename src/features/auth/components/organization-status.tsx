import { TenantStateErrorCode } from "@/features/auth/types";
import { ClockIcon, ShieldAlertIcon } from "lucide-react";

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { LinkButton } from "@/components/shared/link-button";

const COPY: Record<TenantStateErrorCode, { title: string; description: string; pending?: boolean }> = {
    TENANT_PENDING_APPROVAL: {
        title: "Waiting for approval",
        description: "Your organization is being reviewed. We'll email you as soon as it's approved.",
        pending: true,
    },
    TENANT_REJECTED: {
        title: "Organization not approved",
        description: "Your organization wasn't approved.",
    },
    TENANT_SUSPENDED: {
        title: "Organization suspended",
        description: "This organization has been suspended. Contact support if you think this is a mistake.",
    },
    MEMBERSHIP_SUSPENDED: {
        title: "Access suspended",
        description: "Your access to this organization has been suspended by its administrators.",
    },
    NOT_A_MEMBER: {
        title: "Not a member",
        description: "Your account doesn't belong to this organization.",
    },
    NO_ORGANIZATION: {
        title: "No organization yet",
        description: "Your account isn't part of any organization. Ask for an invitation or create one.",
    },
};

type OrganizationStatusProps = {
    code: TenantStateErrorCode;
    reason?: string;
};

export const OrganizationStatus = ({ code, reason }: OrganizationStatusProps) => {
    const copy = COPY[code];

    return (
        <Empty className="border-none p-0">
            <EmptyHeader>
                <EmptyMedia variant="icon">{copy.pending ? <ClockIcon /> : <ShieldAlertIcon />}</EmptyMedia>
                <EmptyTitle>{copy.title}</EmptyTitle>
                <EmptyDescription>
                    {copy.description}
                    {code === "TENANT_REJECTED" && reason ? ` Reason: ${reason}` : ""}
                </EmptyDescription>
            </EmptyHeader>
            <LinkButton href="/auth/sign-in" variant="outline">
                Back to sign in
            </LinkButton>
        </Empty>
    );
};
