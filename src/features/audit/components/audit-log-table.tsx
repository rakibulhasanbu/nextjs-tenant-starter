"use client";

import { useMemo } from "react";

import { useAuditLogs } from "@/features/audit/api";
import { AUDIT_ACTION_GROUPS, AuditLog, AuditScope } from "@/features/audit/types";

import { QueryParams } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import {
    DataTable,
    DataTableFilter,
    DataTableHeader,
    DataTableProvider,
    useDataTableUrlState,
} from "@/components/table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import type { DataTableColumnDef } from "@/components/table/features";

const buildColumns = (scope: AuditScope): DataTableColumnDef<AuditLog>[] => [
    {
        accessorKey: "createdAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title="When" />,
        cell: ({ row }) => (
            <Text variant="small" tone="muted">
                {new Date(row.original.createdAt).toLocaleString()}
            </Text>
        ),
    },
    {
        accessorKey: "action",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Action" />,
        filterFn: "equalsString",
        cell: ({ row }) => <Badge variant="outline">{row.original.action}</Badge>,
    },
    {
        id: "target",
        header: "Target",
        cell: ({ row }) =>
            row.original.targetType ? (
                <div className="flex flex-col">
                    <Text variant="small">{row.original.targetType}</Text>
                    <Text variant="small" tone="muted" className="max-w-48 truncate">
                        {row.original.targetId}
                    </Text>
                </div>
            ) : null,
    },
    {
        accessorKey: "actorId",
        header: "Actor",
        cell: ({ row }) => (
            <Text variant="small" tone="muted" className="max-w-40 truncate">
                {row.original.actorId ?? "System"}
            </Text>
        ),
    },
    ...(scope === "platform"
        ? [
              {
                  accessorKey: "tenantId",
                  header: "Organization",
                  cell: ({ row }) => (
                      <Text variant="small" tone="muted" className="max-w-40 truncate">
                          {row.original.tenantId ?? "Platform"}
                      </Text>
                  ),
              } satisfies DataTableColumnDef<AuditLog>,
          ]
        : []),
];

const actionOptions = AUDIT_ACTION_GROUPS.map((group) => ({ value: group.value, label: group.label }));

/** The append-only trail: the organization's own for tenant admins, every organization's for the super admin. */
export const AuditLogTable = ({ scope }: { scope: AuditScope }) => {
    const { pagination, columnFilters } = useDataTableUrlState({ defaultPageSize: 20 });

    const params = useMemo<QueryParams>(() => {
        const action = columnFilters.find((f) => f.id === "action")?.value;
        return {
            page: pagination.pageIndex + 1,
            limit: pagination.pageSize,
            action: Array.isArray(action) ? action[0] : action,
        };
    }, [pagination, columnFilters]);

    const { data, isLoading } = useAuditLogs(scope, params);
    const columns = useMemo(() => buildColumns(scope), [scope]);

    return (
        <DataTableProvider data={data?.data} columns={columns} rowCount={data?.meta?.total} getRowId={(row) => row.id}>
            <DataTableHeader filters={<DataTableFilter columnId="action" title="Action" options={actionOptions} />} />
            <DataTable<AuditLog>
                isLoading={isLoading}
                emptyTitle="No activity yet"
                emptyDescription="Changes to roles, members and the organization show up here."
            />
        </DataTableProvider>
    );
};
