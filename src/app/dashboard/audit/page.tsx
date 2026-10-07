import type { Metadata } from "next";

import { AuditLogTable } from "@/features/audit/components/audit-log-table";

import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Audit log" };

export default function DashboardAuditPage() {
    return (
        <>
            <PageHeader title="Audit log" description="Who changed what in this organization." />
            <AuditLogTable scope="tenant" />
        </>
    );
}
