import { redirect } from "next/navigation";

import { canViewDashboard } from "@/features/auth/types";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";

import { getCurrentUser } from "@/lib/current-user";

/**
 * The real gate for the admin area. `proxy.ts` has already redirected on the
 * `user` cookie, but that is a snapshot; this re-reads `/users/me` so a revoked
 * role or a suspension takes effect on the next navigation instead of at the
 * next sign-in. Gating on a permission key, not a role name, mirrors the
 * backend — nothing there checks what a role is called.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const user = await getCurrentUser();

    if (!user || !canViewDashboard(user.permissions)) {
        redirect("/account");
    }

    return <DashboardShell>{children}</DashboardShell>;
}
