import { redirect } from "next/navigation";

import { allowedDashboardNavItems } from "@/features/dashboard/nav-config";

import { getCurrentUser } from "@/lib/current-user";

/** The dashboard's front door is whichever page the caller can actually use first. */
export default async function DashboardIndexPage() {
    const user = await getCurrentUser();
    const [first] = allowedDashboardNavItems(user?.permissions);

    redirect(first?.url ?? "/account");
}
