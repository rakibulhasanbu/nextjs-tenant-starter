import type { Metadata } from "next";

import { AcceptInviteForm } from "@/features/auth/components/accept-invite-form";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";

export const metadata: Metadata = { title: "Accept invitation" };

export default async function AcceptInvitePage({ searchParams }: PageProps<"/accept-invite">) {
    const params = await searchParams;
    const token = typeof params.token === "string" ? params.token : undefined;

    return (
        <Card className="shadow-card">
            <CardHeader>
                <CardTitle>
                    <Text variant="h3" render={<h1 />}>
                        You&apos;re invited
                    </Text>
                </CardTitle>
                <CardDescription>Choose a password to join your organization</CardDescription>
            </CardHeader>
            <CardContent>
                <AcceptInviteForm token={token} />
            </CardContent>
        </Card>
    );
}
