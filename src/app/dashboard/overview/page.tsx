import type { Metadata } from "next";

import { OverviewStats } from "@/features/dashboard/components/overview-stats";

import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Overview" };

export default function DashboardOverviewPage() {
    return (
        <>
            <PageHeader title="Overview" description="A snapshot of your organization's members." />
            <OverviewStats />
        </>
    );
}
