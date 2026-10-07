"use client";

import { useMemo, useState } from "react";

import { usePlatformTenantRequests, useTenantRequestDecisionMutation } from "@/features/platform/api";
import { CreatePlatformTenantDialog } from "@/features/platform/components/create-platform-tenant-dialog";
import { RejectDialog } from "@/features/platform/components/reject-dialog";
import { TenantRequest, TenantRequestStatus } from "@/features/tenant-requests/types";
import { MoreHorizontalIcon } from "lucide-react";

import { ApiError, QueryParams } from "@/lib/api-client";
import { useAlert } from "@/hooks/use-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Text } from "@/components/ui/text";
import { toast } from "@/components/ui/toast";
import {
    DataTable,
    DataTableFilter,
    DataTableHeader,
    DataTableProvider,
    DataTableSearch,
    useDataTableUrlState,
} from "@/components/table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import type { DataTableColumnDef } from "@/components/table/features";

const statusVariant: Record<TenantRequestStatus, "default" | "secondary" | "destructive"> = {
    [TenantRequestStatus.PENDING]: "secondary",
    [TenantRequestStatus.APPROVED]: "default",
    [TenantRequestStatus.REJECTED]: "destructive",
};

const statusOptions = [
    { value: TenantRequestStatus.PENDING, label: "Pending" },
    { value: TenantRequestStatus.APPROVED, label: "Approved" },
    { value: TenantRequestStatus.REJECTED, label: "Rejected" },
];

const errorMessage = (error: unknown) => (error instanceof ApiError ? error.message : "Something went wrong");

/** Registration requests (`ADMIN_ONLY` mode): approve, then turn the approved request into an organization. */
export const PlatformRequestsTable = () => {
    const { pagination, searchTerm, columnFilters } = useDataTableUrlState({ defaultPageSize: 20 });
    const alert = useAlert();
    const [rejecting, setRejecting] = useState<TenantRequest | null>(null);
    const [converting, setConverting] = useState<TenantRequest | null>(null);

    const params = useMemo<QueryParams>(() => {
        const status = columnFilters.find((f) => f.id === "status")?.value;
        return {
            page: pagination.pageIndex + 1,
            limit: pagination.pageSize,
            q: searchTerm || undefined,
            status: Array.isArray(status) ? status[0] : status,
        };
    }, [pagination, searchTerm, columnFilters]);

    const { data, isLoading } = usePlatformTenantRequests(params);
    const decide = useTenantRequestDecisionMutation();

    const handleApprove = (request: TenantRequest) => {
        alert.fire({
            title: "Approve this request?",
            text: "You can then create the organization and invite its owner.",
            confirmButtonOptions: { text: "Approve" },
            showCancelButton: true,
            onConfirm: async () => {
                try {
                    await decide.mutateAsync({ id: request.id, action: "approve" });
                    toast.add({ title: "Request approved", type: "success" });
                } catch (error) {
                    toast.add({ title: "Action failed", description: errorMessage(error), type: "error" });
                }
            },
        });
    };

    const handleReject = async (reason: string | undefined) => {
        if (!rejecting) return;
        try {
            await decide.mutateAsync({ id: rejecting.id, action: "reject", reason });
            toast.add({ title: "Request rejected" });
            setRejecting(null);
        } catch (error) {
            toast.add({ title: "Action failed", description: errorMessage(error), type: "error" });
        }
    };

    const columns = useMemo<DataTableColumnDef<TenantRequest>[]>(
        () => [
            {
                accessorKey: "businessName",
                header: ({ column }) => <DataTableColumnHeader column={column} title="Business" />,
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <Text variant="small" weight="medium">
                            {row.original.businessName}
                        </Text>
                        <Text variant="small" tone="muted">
                            {row.original.ownerName} · {row.original.email}
                        </Text>
                    </div>
                ),
            },
            {
                accessorKey: "phone",
                header: "Phone",
                cell: ({ row }) => (
                    <Text variant="small" tone="muted">
                        {row.original.phone}
                    </Text>
                ),
            },
            {
                accessorKey: "status",
                header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
                filterFn: "equalsString",
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <Badge variant={statusVariant[row.original.status]}>{row.original.status}</Badge>
                        {row.original.status === TenantRequestStatus.APPROVED && !row.original.tenantId && (
                            <Badge variant="outline">No organization yet</Badge>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: "createdAt",
                header: ({ column }) => <DataTableColumnHeader column={column} title="Received" />,
                cell: ({ row }) => (
                    <Text variant="small" tone="muted">
                        {new Date(row.original.createdAt).toLocaleDateString()}
                    </Text>
                ),
            },
            {
                id: "actions",
                enableHiding: false,
                cell: ({ row }) => {
                    const request = row.original;
                    const canConvert = request.status === TenantRequestStatus.APPROVED && !request.tenantId;
                    if (request.status !== TenantRequestStatus.PENDING && !canConvert) return null;

                    return (
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <Button variant="ghost" size="icon-sm" aria-label="Row actions">
                                        <MoreHorizontalIcon />
                                    </Button>
                                }
                            />
                            <DropdownMenuContent align="end">
                                {request.status === TenantRequestStatus.PENDING && (
                                    <>
                                        <DropdownMenuItem onClick={() => handleApprove(request)}>
                                            Approve
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setRejecting(request)}>
                                            Reject
                                        </DropdownMenuItem>
                                    </>
                                )}
                                {canConvert && (
                                    <DropdownMenuItem onClick={() => setConverting(request)}>
                                        Create organization
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    );
                },
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    return (
        <DataTableProvider data={data?.data} columns={columns} rowCount={data?.meta?.total} getRowId={(row) => row.id}>
            <DataTableHeader
                filters={
                    <>
                        <DataTableSearch placeholder="Search by business, owner or email..." />
                        <DataTableFilter columnId="status" title="Status" options={statusOptions} />
                    </>
                }
            />
            <DataTable<TenantRequest>
                isLoading={isLoading}
                emptyTitle="No requests"
                emptyDescription="Registration requests show up here when onboarding is by request."
            />
            <RejectDialog
                open={!!rejecting}
                onOpenChange={(open) => !open && setRejecting(null)}
                title="Reject this request?"
                description={rejecting ? `${rejecting.ownerName} will be told it wasn't approved.` : undefined}
                isLoading={decide.isPending}
                onConfirm={handleReject}
            />
            <CreatePlatformTenantDialog
                open={!!converting}
                onOpenChange={(open) => !open && setConverting(null)}
                request={converting}
            />
        </DataTableProvider>
    );
};
