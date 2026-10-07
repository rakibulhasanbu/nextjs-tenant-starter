import { LucideIcon } from "lucide-react";

/**
 * Role ids are lowercase slugs, unique per tenant: roles are rows created at
 * runtime. Only the three template roles every new tenant starts with are known
 * at compile time — see the backend's `role-templates.constant.ts`.
 */
export const ROLE_IDS = {
    USER: "user",
    ADMIN: "admin",
    OWNER: "owner",
} as const;

export type RoleId = (typeof ROLE_IDS)[keyof typeof ROLE_IDS];

export const hasRole = (roleIds: string[] | undefined, roleId: string) => !!roleIds?.includes(roleId);

/**
 * Mirrors the backend's permission catalog
 * (`src/common/authorization/permissions.constant.ts`), which is the source of
 * truth. Gate UI on these, never on a role name — roles are created at runtime
 * and their contents are editable. `PLATFORM_*` keys belong to the single super
 * admin and only exist on the platform host.
 */
export const PERMISSIONS = {
    TENANT_READ: "tenant:read",
    TENANT_UPDATE: "tenant:update",
    USER_READ_ANY: "user:read:any",
    USER_STATUS_ANY: "user:status:any",
    USER_INVITE: "user:invite",
    USER_PASSWORD_RESET_ANY: "user:password-reset:any",
    SESSION_READ_ANY: "session:read:any",
    SESSION_REVOKE_ANY: "session:revoke:any",
    ROLE_READ: "role:read",
    ROLE_WRITE: "role:write",
    ROLE_ASSIGN: "role:assign",
    PERMISSION_READ: "permission:read",
    AUDIT_READ: "audit:read",
    PLATFORM_TENANT_READ: "platform:tenant:read",
    PLATFORM_TENANT_REVIEW: "platform:tenant:review",
    PLATFORM_TENANT_CREATE: "platform:tenant:create",
    PLATFORM_TENANT_SUSPEND: "platform:tenant:suspend",
    PLATFORM_SETTINGS_READ: "platform:settings:read",
    PLATFORM_SETTINGS_WRITE: "platform:settings:write",
    PLATFORM_AUDIT_READ: "platform:audit:read",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const hasPermission = (permissions: string[] | undefined, permission: PermissionKey) =>
    !!permissions?.includes(permission);

/** Any of these opens the tenant admin area; each nav item then gates on its own key. */
export const DASHBOARD_PERMISSIONS: readonly PermissionKey[] = [
    PERMISSIONS.USER_READ_ANY,
    PERMISSIONS.ROLE_READ,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.TENANT_UPDATE,
];

export const canViewDashboard = (permissions: string[] | undefined) =>
    DASHBOARD_PERMISSIONS.some((permission) => hasPermission(permissions, permission));

export enum TenantStatus {
    PENDING_APPROVAL = "PENDING_APPROVAL",
    ACTIVE = "ACTIVE",
    REJECTED = "REJECTED",
    SUSPENDED = "SUSPENDED",
}

/** The organization a session acts in (`null` on the platform host). */
export interface SessionTenant {
    id: string;
    slug: string;
    name: string;
    url: string;
}

/** One entry of the tenant picker returned when a sign-in matches several organizations. */
export interface SelectableTenant {
    slug: string;
    name: string;
    status: TenantStatus;
    url: string;
}

export enum UserStatus {
    PENDING_VERIFICATION = "PENDING_VERIFICATION",
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED",
}

export enum Gender {
    MALE = "MALE",
    FEMALE = "FEMALE",
    OTHER = "OTHER",
    PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY",
}

/**
 * Optional personal details. The backend keeps these in a separate
 * `user_profiles` table and nests them under `profile` on the way out — and
 * expects the same nesting on `PATCH /users/me`.
 */
export interface UserProfile {
    /** Calendar date (YYYY-MM-DD) — stored as a DATE, never a timestamp. */
    dateOfBirth: string | null;
    gender: Gender | null;
    bio: string | null;
}

/** Shape of the backend's `PublicUser`: the global account minus secrets, plus this tenant's role slugs and profile. */
export interface User {
    id: string;
    email: string;
    username: string;
    name: string | null;
    phone: string | null;
    avatarUrl: string | null;
    roleIds: string[];
    profile: UserProfile | null;
    status: UserStatus;
    emailVerifiedAt: string | null;
    twoFactorEnabled: boolean;
    /** False for Google-only accounts: offer set-password, not change-password. */
    hasPassword: boolean;
    createdAt: string;
    updatedAt: string;
    /** Only present on the caller's own record (`/users/me`) — it describes the requester. */
    permissions: PermissionKey[];
    /** Highest rank across the caller's roles; they may only manage subjects ranked below it. */
    maxRank: number;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    tenant: SessionTenant | null;
}

/** Sign-in matched several usable organizations: finish with `POST /auth/select-tenant`. */
export interface TenantSelectionResponse {
    tenantSelectionRequired: true;
    selectionToken: string;
    tenants: SelectableTenant[];
}

/** `/auth/signin` returns tokens, a 2FA challenge, or a tenant picker. */
export type SignInResult = AuthResponse | TwoFactorRequiredResponse | TenantSelectionResponse;

export interface TwoFactorRequiredResponse {
    twoFactorRequired: true;
    twoFactorToken: string;
}

export const isTwoFactorRequired = (result: SignInResult): result is TwoFactorRequiredResponse =>
    "twoFactorRequired" in result && result.twoFactorRequired === true;

export const isTenantSelectionRequired = (result: SignInResult): result is TenantSelectionResponse =>
    "tenantSelectionRequired" in result && result.tenantSelectionRequired === true;

/** Error codes that mean "this organization can't be entered right now" — shown as a status screen, not a toast. */
export const TENANT_STATE_ERROR_CODES = [
    "TENANT_PENDING_APPROVAL",
    "TENANT_REJECTED",
    "TENANT_SUSPENDED",
    "MEMBERSHIP_SUSPENDED",
    "NOT_A_MEMBER",
    "NO_ORGANIZATION",
] as const;

export type TenantStateErrorCode = (typeof TENANT_STATE_ERROR_CODES)[number];

export const isTenantStateError = (code?: string): code is TenantStateErrorCode =>
    !!code && (TENANT_STATE_ERROR_CODES as readonly string[]).includes(code);

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
        title: string;
        url: string;
    }[];
    activeSubPaths?: string[];
    excludePaths?: string[];
}
