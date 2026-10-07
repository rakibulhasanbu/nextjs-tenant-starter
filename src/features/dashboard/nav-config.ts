import { NavItem, PermissionKey, PERMISSIONS } from "@/features/auth/types";
import { LayoutDashboardIcon, ScrollTextIcon, SettingsIcon, ShieldCheckIcon, UsersIcon } from "lucide-react";

/** An item shows only for callers holding `permission` — the same key the backend checks on that page's endpoints. */
export type DashboardNavItem = NavItem & { permission: PermissionKey };

export const dashboardNavItems: DashboardNavItem[] = [
    { title: "Overview", url: "/dashboard/overview", icon: LayoutDashboardIcon, permission: PERMISSIONS.USER_READ_ANY },
    { title: "Users", url: "/dashboard/users", icon: UsersIcon, permission: PERMISSIONS.USER_READ_ANY },
    { title: "Roles", url: "/dashboard/roles", icon: ShieldCheckIcon, permission: PERMISSIONS.ROLE_READ },
    { title: "Audit log", url: "/dashboard/audit", icon: ScrollTextIcon, permission: PERMISSIONS.AUDIT_READ },
    {
        title: "Organization",
        url: "/dashboard/organization",
        icon: SettingsIcon,
        permission: PERMISSIONS.TENANT_UPDATE,
    },
];

export const allowedDashboardNavItems = (permissions: string[] | undefined) =>
    dashboardNavItems.filter((item) => !!permissions?.includes(item.permission));
