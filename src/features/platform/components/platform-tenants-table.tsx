"use client";

import { useMemo, useState } from "react";

import { TenantStatus } from "@/features/auth/types";
import {
    TenantTransition,
    usePlatformTenants,
    useResendOwnerInviteMutation,
    useTenantTransitionMutation,
} from "@/features/platform/api";
import { CreatePlatformTenantDialog } from "@/features/platform/components/create-platform-tenant-dialog";
import { RejectDialog } from "@/features/platform/components/reject-dialog";
import { PlatformTenant } from "@/features/platform/types";
import { MoreHorizontalIcon, PlusIcon } from "lucide-react";

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

const statusVariant: Record<TenantStatus, "default" | "secondary" | "destructive" | "outline"> = {
    [TenantStatus.ACTIVE]: "default",
    [TenantStatus.PENDING_APPROVAL]: "secondary",
    [TenantStatus.REJECTED]: "destructive",
    [TenantStatus.SUSPENDED]: "destructive",
};

const statusOptions = [
    { value: TenantStatus.PENDING_APPROVAL, label: "Pending approval" },
    { value: TenantStatus.ACTIVE, label: "Active" },
    { value: TenantStatus.SUSPENDED, label: "Suspended" },
    { value: TenantStatus.REJECTED, label: "Rejected" },
];

const TRANSITION_COPY: Record<
    Exclude<TenantTransition, "reject">,
    { title: string; text: string; confirm: string; done: string }
> = {
    approve: {
        title: "Approve this organization?",
        text: "Its owner can sign in right away.",
        confirm: "Approve",
        done: "Organization approved",
    },
    suspend: {
        title: "Suspend this organization?",
        text: "Every member is locked out immediately, including live sessions.",
        confirm: "Suspend",
        done: "Organization suspended",
    },
    reactivate: {
        title: "Reactivate this organization?",
        text: "Members can sign in again.",
        confirm: "Reactivate",
        done: "Organization reactivated",
    },
};

const errorMessage = (error: unknown) => (error instanceof ApiError ? error.message : "Something went wrong");

export const PlatformTenantsTable = () => {
    const { pagination, searchTerm, columnFilters } = useDataTableUrlState({ defaultPageSize: 20 });
    const alert = useAlert();
    const [createOpen, setCreateOpen] = useState(false);
    const [rejecting, setRejecting] = useState<PlatformTenant | null>(null);

    const params = useMemo<QueryParams>(() => {
        const status = columnFilters.find((f) => f.id === "status")?.value;
        return {
            page: pagination.pageIndex + 1,
            limit: pagination.pageSize,
            q: searchTerm || undefined,
            status: Array.isArray(status) ? status[0] : status,
        };
    }, [pagination, searchTerm, columnFilters]);

    const { data, isLoading } = usePlatformTenants(params);
    const transition = useTenantTransitionMutation();
    const resendInvite = useResendOwnerInviteMutation();

    const confirmTransition = (tenant: PlatformTenant, action: Exclude<TenantTransition, "reject">) => {
        const copy = TRANSITION_COPY[action];
        alert.fire({
            title: copy.title,
            text: copy.text,
            confirmButtonOptions: { variant: action === "suspend" ? "destructive" : "default", text: copy.confirm },
            showCancelButton: true,
            onConfirm: async () => {
                try {
                    await transition.mutateAsync({ id: tenant.id, action });
                    toast.add({ title: copy.done, type: "success" });
                } catch (error) {
                    toast.add({ title: "Action failed", description: errorMessage(error), type: "error" });
                }
            },
        });
    };

    const handleResendInvite = async (tenant: PlatformTenant) => {
        try {
            await resendInvite.mutateAsync(tenant.id);
            toast.add({ title: "Invitation resent", type: "success" });
        } catch (error) {
            const description =
                error instanceof ApiError && error.code === "INVITE_ALREADY_ACCEPTED"
                    ? "The owner has already accepted the invitation."
                    : errorMessage(error);
            toast.add({ title: "Couldn't resend invitation", description, type: "error" });
        }
    };

    const handleReject = async (reason: string | undefined) => {
        if (!rejecting) return;
        try {
            await transition.mutateAsync({ id: rejecting.id, action: "reject", reason });
            toast.add({ title: "Organization rejected" });
            setRejecting(null);
        } catch (error) {
            toast.add({ title: "Action failed", description: errorMessage(error), type: "error" });
        }
    };

    const columns = useMemo<DataTableColumnDef<PlatformTenant>[]>(
        () => [
            {
                accessorKey: "name",
                header: ({ column }) => <DataTableColumnHeader column={column} title="Organization" />,
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <Text variant="small" weight="medium">
                            {row.original.name}
                        </Text>
                        <Text variant="small" tone="muted">
                            {row.original.slug}
                        </Text>
                    </div>
                ),
            },
            {
                accessorKey: "status",
                header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
                filterFn: "equalsString",
                cell: ({ row }) => (
                    <Badge variant={statusVariant[row.original.status]}>{row.original.status.replace("_", " ")}</Badge>
                ),
            },
            {
                accessorKey: "createdAt",
                header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
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
                    const tenant = row.original;
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
                                {tenant.status === TenantStatus.PENDING_APPROVAL && (
                                    <>
                                        <DropdownMenuItem onClick={() => confirmTransition(tenant, "approve")}>
                                            Approve
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setRejecting(tenant)}>Reject</DropdownMenuItem>
                                    </>
                                )}
                                {tenant.status === TenantStatus.ACTIVE && (
                                    <>
                                        <DropdownMenuItem onClick={() => confirmTransition(tenant, "suspend")}>
                                            Suspend
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleResendInvite(tenant)}>
                                            Resend owner invitation
                                        </DropdownMenuItem>
                                    </>
                                )}
                                {tenant.status === TenantStatus.SUSPENDED && (
                                    <DropdownMenuItem onClick={() => confirmTransition(tenant, "reactivate")}>
                                        Reactivate
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
                        <DataTableSearch placeholder="Search by name or subdomain..." />
                        <DataTableFilter columnId="status" title="Status" options={statusOptions} />
                    </>
                }
                actions={
                    <Button size="sm" onClick={() => setCreateOpen(true)}>
                        <PlusIcon data-icon="inline-start" />
                        New organization
                    </Button>
                }
            />
            <DataTable<PlatformTenant>
                isLoading={isLoading}
                emptyTitle="No organizations found"
                emptyDescription="Try adjusting your search or filters."
            />
            <CreatePlatformTenantDialog open={createOpen} onOpenChange={setCreateOpen} />
            <RejectDialog
                open={!!rejecting}
                onOpenChange={(open) => !open && setRejecting(null)}
                title="Reject this organization?"
                description={rejecting ? `${rejecting.name} won't be able to sign in.` : undefined}
                isLoading={transition.isPending}
                onConfirm={handleReject}
            />
        </DataTableProvider>
    );
};
