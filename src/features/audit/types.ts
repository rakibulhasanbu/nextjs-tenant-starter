/** One row of `GET /audit-logs` (tenant) or `GET /platform/audit-logs` (super admin). */
export interface AuditLog {
    id: string;
    /** `null` for a platform-level action. */
    tenantId: string | null;
    /** `null` for the system itself. */
    actorId: string | null;
    action: string;
    targetType: string | null;
    targetId: string | null;
    metadata: Record<string, unknown>;
    requestId: string | null;
    createdAt: string;
}

export type AuditScope = "tenant" | "platform";

/** Prefix filters the backend accepts (`role.*` matches every `role.<verb>`). */
export const AUDIT_ACTION_GROUPS = [
    { value: "tenant.*", label: "Organization" },
    { value: "membership.*", label: "Members" },
    { value: "role.*", label: "Roles" },
    { value: "tenant-request.*", label: "Registration requests" },
    { value: "tenant-invitation.*", label: "Invitations" },
    { value: "platform.*", label: "Platform" },
] as const;
