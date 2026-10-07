import type { Metadata } from "next";

import { PlatformRequestsTable } from "@/features/platform/components/platform-requests-table";

import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Requests" };

export default function PlatformRequestsPage() {
    return (
        <>
            <PageHeader title="Requests" description="Registration requests waiting for a decision." />
            <PlatformRequestsTable />
        </>
    );
}
