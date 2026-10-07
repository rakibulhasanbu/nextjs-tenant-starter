import type { Metadata } from "next";

import { AuditLogTable } from "@/features/audit/components/audit-log-table";

import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Audit log" };

export default function PlatformAuditPage() {
    return (
        <>
            <PageHeader title="Audit log" description="Activity across every organization and the platform itself." />
            <AuditLogTable scope="platform" />
        </>
    );
}
