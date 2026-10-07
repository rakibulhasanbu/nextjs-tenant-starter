import { redirect } from "next/navigation";

import { hasPermission, PERMISSIONS } from "@/features/auth/types";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";

import { getCurrentUser } from "@/lib/current-user";

/** The super admin console. Re-reads `/users/me` like the dashboard gate does; `proxy.ts` only keeps other hosts out. */
export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
    const user = await getCurrentUser();

    if (!user || !hasPermission(user.permissions, PERMISSIONS.PLATFORM_TENANT_READ)) {
        redirect("/auth/sign-in");
    }

    return <DashboardShell variant="platform">{children}</DashboardShell>;
}
