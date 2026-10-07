import { SessionTenant, TenantStatus } from "@/features/auth/types";

export type { SessionTenant };

/** `GET|PATCH /tenant` — the organization the session acts in. The slug is its address and never changes. */
export interface Tenant {
    id: string;
    slug: string;
    name: string;
    status: TenantStatus;
    rejectionReason: string | null;
    url: string;
    createdAt: string;
    updatedAt: string;
}

export enum MembershipStatus {
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED",
}

/** `GET /me/tenants` — every organization of the caller, with the state that says whether it can be entered. */
export interface MyTenant {
    id: string;
    slug: string;
    name: string;
    status: TenantStatus;
    rejectionReason: string | null;
    membershipStatus: MembershipStatus;
    url: string;
}

export interface TenantSwitch {
    tenant: SessionTenant;
    exchangeCode: string;
}

/** Whether an organization from the caller's list can be opened right now. */
export const isTenantEnterable = (tenant: Pick<MyTenant, "status" | "membershipStatus">) =>
    tenant.status === TenantStatus.ACTIVE && tenant.membershipStatus === MembershipStatus.ACTIVE;
