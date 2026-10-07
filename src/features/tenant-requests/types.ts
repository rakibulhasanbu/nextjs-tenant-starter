export enum TenantOnboardingMode {
    SELF_SIGNUP = "SELF_SIGNUP",
    ADMIN_ONLY = "ADMIN_ONLY",
}

export enum TenantRequestStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
}

/** `GET /tenant-requests/config` — public; tells the apex which onboarding path to offer. */
export interface TenantRequestConfig {
    mode: TenantOnboardingMode;
    selfSignupEnabled: boolean;
    registrationRequestEnabled: boolean;
}

export interface TenantRequest {
    id: string;
    businessName: string;
    ownerName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address: string;
    extra: Record<string, string | number | boolean>;
    status: TenantRequestStatus;
    rejectionReason: string | null;
    tenantId: string | null;
    createdAt: string;
    updatedAt: string;
}
