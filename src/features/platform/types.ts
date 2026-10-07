import { TenantStatus } from "@/features/auth/types";
import { TenantOnboardingMode } from "@/features/tenant-requests/types";

export { TenantOnboardingMode };

/** A tenant as the super admin sees it (`GET /platform/tenants`). */
export interface PlatformTenant {
    id: string;
    slug: string;
    name: string;
    status: TenantStatus;
    rejectionReason: string | null;
    url: string;
    reviewedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

/** `GET|PATCH /platform/settings`. */
export interface PlatformSettings {
    tenantOnboardingMode: TenantOnboardingMode;
    requireTenantApproval: boolean;
    maxTenantsPerUser: number;
    updatedAt: string;
}

export interface CreatePlatformTenantPayload {
    name: string;
    slug: string;
    ownerEmail?: string;
    /** An approved registration request whose email becomes the owner. */
    requestId?: string;
}

export interface CreatePlatformTenantResult {
    tenant: PlatformTenant;
    owner: { id: string; email: string; isNewAccount: boolean };
    /** False when the tenant exists but the invitation mail failed — resend it from the tenant row. */
    inviteSent: boolean;
}

export type UpdatePlatformSettingsPayload = Partial<Omit<PlatformSettings, "updatedAt">>;
