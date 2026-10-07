import { AuditLog, AuditScope } from "@/features/audit/types";
import { useQuery } from "@tanstack/react-query";

import { apiFetchPaginated, QueryParams } from "@/lib/api-client";

export const auditKeys = {
    all: ["audit-logs"] as const,
    list: (scope: AuditScope, params: QueryParams) => [...auditKeys.all, scope, params] as const,
};

const ENDPOINTS: Record<AuditScope, string> = {
    tenant: "/audit-logs",
    platform: "/platform/audit-logs",
};

export const useAuditLogs = (scope: AuditScope, params: QueryParams) =>
    useQuery({
        queryKey: auditKeys.list(scope, params),
        queryFn: () => apiFetchPaginated<AuditLog>(ENDPOINTS[scope], { params }),
    });
