"use client";

import { useMemo, useState } from "react";

import { useMe } from "@/features/account/api";
import { hasPermission, PERMISSIONS } from "@/features/auth/types";
import { useAdminUsers, useTriggerPasswordResetMutation, useUpdateUserStatusMutation } from "@/features/dashboard/api";
import { InviteUserDialog } from "@/features/dashboard/components/invite-user-dialog";
import { UserEditDialog } from "@/features/dashboard/components/user-edit-dialog";
import { UserSessionsDialog } from "@/features/dashboard/components/user-sessions-dialog";
import { buildUsersColumns, canActorManage } from "@/features/dashboard/components/users-columns";
import { AdminUser, MembershipStatus } from "@/features/dashboard/types";
import { useRoles } from "@/features/roles/api";
import { useAuthStore } from "@/store/auth-store";

import { ApiError, QueryParams } from "@/lib/api-client";
import { useAlert } from "@/hooks/use-alert";
import { toast } from "@/components/ui/toast";
import {
    DataTable,
    DataTableFacetedFilter,
    DataTableHeader,
    DataTableProvider,
    DataTableSearch,
    useDataTableUrlState,
} from "@/components/table";

const statusOptions = [
    { value: MembershipStatus.ACTIVE, label: "Active" },
    { value: MembershipStatus.SUSPENDED, label: "Suspended" },
];

const UsersTableInner = () => {
    const { pagination, searchTerm, columnFilters } = useDataTableUrlState({ defaultPageSize: 20 });
    const alert = useAlert();
    const actorId = useAuthStore((state) => state.user?.id);
    const { data: me } = useMe();
    const { data: roles } = useRoles();

    // Gate on the permissions the backend actually checks, not on a role name.
    const canInvite = hasPermission(me?.permissions, PERMISSIONS.USER_INVITE);
    const canAssignRoles = hasPermission(me?.permissions, PERMISSIONS.ROLE_ASSIGN);

    const roleOptions = useMemo(() => (roles ?? []).map((role) => ({ value: role.id, label: role.name })), [roles]);

    const [editing, setEditing] = useState<AdminUser | null>(null);
    const [viewingSessions, setViewingSessions] = useState<AdminUser | null>(null);

    const params = useMemo<QueryParams>(() => {
        const roleId = columnFilters.find((f) => f.id === "roleIds")?.value;
        const status = columnFilters.find((f) => f.id === "membershipStatus")?.value;
        return {
            page: pagination.pageIndex + 1,
            limit: pagination.pageSize,
            search: searchTerm || undefined,
            // The backend's list query is a strictObject keyed on `roleId` — `role` would 400.
            roleId: Array.isArray(roleId) ? roleId[0] : roleId,
            status: Array.isArray(status) ? status[0] : status,
        };
    }, [pagination, searchTerm, columnFilters]);

    const { data, isLoading } = useAdminUsers(params);

    const updateStatus = useUpdateUserStatusMutation();
    const triggerReset = useTriggerPasswordResetMutation();

    const handleToggleStatus = (user: AdminUser) => {
        const nextStatus =
            user.membershipStatus === MembershipStatus.ACTIVE ? MembershipStatus.SUSPENDED : MembershipStatus.ACTIVE;
        alert.fire({
            title: nextStatus === MembershipStatus.SUSPENDED ? "Suspend this user?" : "Reactivate this user?",
            text:
                nextStatus === MembershipStatus.SUSPENDED
                    ? "They'll lose access to this organization immediately. Their other organizations aren't affected."
                    : undefined,
            confirmButtonOptions: {
                variant: nextStatus === MembershipStatus.SUSPENDED ? "destructive" : "default",
                text: nextStatus === MembershipStatus.SUSPENDED ? "Suspend" : "Reactivate",
            },
            showCancelButton: true,
            onConfirm: async () => {
                try {
                    await updateStatus.mutateAsync({ id: user.id, status: nextStatus });
                    toast.add({
                        title: nextStatus === MembershipStatus.SUSPENDED ? "User suspended" : "User reactivated",
                    });
                } catch (error) {
                    toast.add({
                        title: "Update failed",
                        description: error instanceof ApiError ? error.message : "Something went wrong",
                        type: "error",
                    });
                }
            },
        });
    };

    const handleResetPassword = (user: AdminUser) => {
        alert.fire({
            title: "Send password reset email?",
            text: `A reset link will be emailed to ${user.email}.`,
            confirmButtonOptions: { text: "Send" },
            showCancelButton: true,
            onConfirm: async () => {
                await triggerReset.mutateAsync(user.id);
                toast.add({ title: "Password reset email sent" });
            },
        });
    };

    const columns = useMemo(
        () =>
            buildUsersColumns({
                canManage: (user) => canActorManage(actorId, user),
                canEditRoles: canAssignRoles,
                onEdit: setEditing,
                onToggleStatus: handleToggleStatus,
                onViewSessions: setViewingSessions,
                onResetPassword: handleResetPassword,
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [actorId, canAssignRoles]
    );

    return (
        <DataTableProvider data={data?.data} columns={columns} rowCount={data?.meta?.total} getRowId={(row) => row.id}>
            <DataTableHeader
                filters={
                    <>
                        <DataTableSearch placeholder="Search by name, email, username..." />
                        <DataTableFacetedFilter columnId="roleIds" title="Role" options={roleOptions} />
                        <DataTableFacetedFilter columnId="membershipStatus" title="Status" options={statusOptions} />
                    </>
                }
                actions={canInvite ? <InviteUserDialog /> : undefined}
            />
            <DataTable<AdminUser>
                isLoading={isLoading}
                emptyTitle="No users found"
                emptyDescription="Try adjusting your search or filters."
                onRowClick={(user) => (canAssignRoles && canActorManage(actorId, user) ? setEditing(user) : undefined)}
            />
            <UserEditDialog user={editing} onOpenChange={(open) => !open && setEditing(null)} />
            <UserSessionsDialog user={viewingSessions} onOpenChange={(open) => !open && setViewingSessions(null)} />
        </DataTableProvider>
    );
};

export const UsersTable = () => <UsersTableInner />;
