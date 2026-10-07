import { UserProfile } from "@/features/auth/types";

/** A member's standing in the *current organization* — the account itself is global and not editable here. */
export enum MembershipStatus {
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED",
}

/** A member of the current organization: the global account plus this tenant's roles and membership state. */
export interface AdminUser {
    id: string;
    email: string;
    username: string;
    name: string | null;
    phone: string | null;
    avatarUrl: string | null;
    roleIds: string[];
    profile: UserProfile | null;
    membershipStatus: MembershipStatus;
    emailVerifiedAt: string | null;
    /** False for Google-only accounts: offer set-password, not change-password. */
    hasPassword: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AdminUserSession {
    id: string;
    userId: string;
    deviceType: string | null;
    deviceName: string | null;
    userAgent: string | null;
    ipAddress: string | null;
    createdAt: string;
    lastUsedAt: string;
    expiresAt: string;
    revokedAt: string | null;
}
