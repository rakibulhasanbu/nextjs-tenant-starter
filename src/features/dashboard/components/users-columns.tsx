"use client";

import { ROLE_IDS } from "@/features/auth/types";
import { AdminUser, MembershipStatus } from "@/features/dashboard/types";
import { MoreHorizontalIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Text } from "@/components/ui/text";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import type { DataTableColumnDef } from "@/components/table/features";

/** Display text for the seeded system roles; runtime-created roles fall back to their slug. */
const ROLE_LABELS: Record<string, string> = {
    [ROLE_IDS.USER]: "User",
    [ROLE_IDS.ADMIN]: "Admin",
    [ROLE_IDS.OWNER]: "Owner",
};

const statusVariant: Record<MembershipStatus, "default" | "destructive"> = {
    [MembershipStatus.ACTIVE]: "default",
    [MembershipStatus.SUSPENDED]: "destructive",
};

type UsersColumnsOptions = {
    canManage: (user: AdminUser) => boolean;
    canEditRoles: boolean;
    /** Opens the role editor. */
    onEdit: (user: AdminUser) => void;
    onToggleStatus: (user: AdminUser) => void;
    onViewSessions: (user: AdminUser) => void;
    onResetPassword: (user: AdminUser) => void;
};

export const buildUsersColumns = ({
    canManage,
    canEditRoles,
    onEdit,
    onToggleStatus,
    onViewSessions,
    onResetPassword,
}: UsersColumnsOptions): DataTableColumnDef<AdminUser>[] => [
    {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        cell: ({ row }) => (
            <div className="flex flex-col">
                <Text variant="small" weight="medium">
                    {row.original.name || row.original.username}
                </Text>
                <Text variant="small" tone="muted">
                    {row.original.email}
                </Text>
            </div>
        ),
    },
    {
        accessorKey: "roleIds",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Roles" />,
        filterFn: "arrHas",
        cell: ({ row }) => (
            <div className="flex flex-wrap gap-1">
                {row.original.roleIds.map((roleId) => (
                    <Badge key={roleId} variant="outline">
                        {ROLE_LABELS[roleId] ?? roleId}
                    </Badge>
                ))}
            </div>
        ),
    },
    {
        accessorKey: "membershipStatus",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        filterFn: "arrHas",
        cell: ({ row }) => (
            <Badge variant={statusVariant[row.original.membershipStatus]}>{row.original.membershipStatus}</Badge>
        ),
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Joined" />,
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
            const user = row.original;
            if (!canManage(user)) return null;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={(event) => event.stopPropagation()}
                                aria-label="Row actions"
                            >
                                <MoreHorizontalIcon />
                            </Button>
                        }
                    />
                    <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                        {canEditRoles && <DropdownMenuItem onClick={() => onEdit(user)}>Manage roles</DropdownMenuItem>}
                        <DropdownMenuItem onClick={() => onToggleStatus(user)}>
                            {user.membershipStatus === MembershipStatus.ACTIVE ? "Suspend" : "Reactivate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onViewSessions(user)}>Sessions</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onResetPassword(user)}>Send password reset</DropdownMenuItem>
                        {/* No delete or edit: identity is global, so an organization admin can only
                            suspend the *membership* — the account itself belongs to the user. */}
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];

/**
 * `GET /admin/users` already filters to accounts ranked strictly below the
 * actor, plus the actor themselves — so anything that reaches this table is
 * manageable except the actor's own row, which the admin routes reject.
 */
export const canActorManage = (actorId: string | undefined, target: AdminUser) => !!actorId && target.id !== actorId;
