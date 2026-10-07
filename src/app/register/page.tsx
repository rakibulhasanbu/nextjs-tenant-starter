import type { Metadata } from "next";

import { TenantRequestForm } from "@/features/tenant-requests/components/tenant-request-form";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { LinkButton } from "@/components/shared/link-button";

export const metadata: Metadata = { title: "Request access" };

export default function RegisterPage() {
    return (
        <Card className="shadow-card">
            <CardHeader>
                <CardTitle>
                    <Text variant="h3" render={<h1 />}>
                        Request access
                    </Text>
                </CardTitle>
                <CardDescription>Tell us about your business and we&apos;ll set up your organization</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
                <TenantRequestForm />
                <Text variant="small" tone="muted" align="center">
                    Already invited?{" "}
                    <LinkButton href="/auth/sign-in" variant="link" className="h-auto p-0 align-baseline">
                        Sign in
                    </LinkButton>
                </Text>
            </CardContent>
        </Card>
    );
}
