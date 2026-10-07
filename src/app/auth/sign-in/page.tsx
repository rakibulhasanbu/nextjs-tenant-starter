import type { Metadata } from "next";

import { SignInForm } from "@/features/auth/components/sign-in-form";

import { getRequestHostKind } from "@/lib/server-host";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { LinkButton } from "@/components/shared/link-button";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage() {
    const hostKind = await getRequestHostKind();

    return (
        <Card className="shadow-card">
            <CardHeader>
                <CardTitle>
                    <Text variant="h3" render={<h1 />}>
                        Welcome back
                    </Text>
                </CardTitle>
                <CardDescription>Sign in to your account to continue</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
                <SignInForm hostKind={hostKind} />
                {hostKind === "apex" && (
                    <Text variant="small" tone="muted" align="center">
                        Don&apos;t have an account?{" "}
                        <LinkButton href="/auth/sign-up" variant="link" className="h-auto p-0 align-baseline">
                            Sign up
                        </LinkButton>
                    </Text>
                )}
            </CardContent>
        </Card>
    );
}
