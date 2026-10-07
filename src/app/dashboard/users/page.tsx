import type { Metadata } from "next";

import { UsersTable } from "@/features/dashboard/components/users-table";

import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Users" };

export default function DashboardUsersPage() {
    return (
        <>
            <PageHeader title="Users" description="Manage this organization's members, roles and access." />
            <UsersTable />
        </>
    );
}
