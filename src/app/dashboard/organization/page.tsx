import type { Metadata } from "next";

import { TenantSettingsCard } from "@/features/tenant/components/tenant-settings-card";

import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Organization" };

export default function DashboardOrganizationPage() {
    return (
        <>
            <PageHeader title="Organization" description="Your organization's name and address." />
            <TenantSettingsCard />
        </>
    );
}
