import type { Metadata } from "next";

import { PlatformTenantsTable } from "@/features/platform/components/platform-tenants-table";

import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Organizations" };

export default function PlatformTenantsPage() {
    return (
        <>
            <PageHeader title="Organizations" description="Every organization on the platform." />
            <PlatformTenantsTable />
        </>
    );
}
