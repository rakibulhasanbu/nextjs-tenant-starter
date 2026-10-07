import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OrganizationStatus } from "@/features/auth/components/organization-status";
import { isTenantStateError } from "@/features/auth/types";

import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Organization status" };

export default async function OrganizationStatusPage({ searchParams }: PageProps<"/auth/organization-status">) {
    const params = await searchParams;
    const code = typeof params.code === "string" ? params.code : undefined;
    const reason = typeof params.reason === "string" ? params.reason : undefined;

    if (!isTenantStateError(code)) redirect("/auth/sign-in");

    return (
        <Card className="shadow-card">
            <CardContent>
                <OrganizationStatus code={code} reason={reason} />
            </CardContent>
        </Card>
    );
}
