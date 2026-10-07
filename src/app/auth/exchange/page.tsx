import type { Metadata } from "next";

import { ExchangeSession } from "@/features/auth/components/exchange-session";

import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Signing you in" };

export default async function ExchangePage({ searchParams }: PageProps<"/auth/exchange">) {
    const params = await searchParams;
    const code = typeof params.code === "string" ? params.code : undefined;

    return (
        <Card className="shadow-card">
            <CardContent>
                <ExchangeSession code={code} />
            </CardContent>
        </Card>
    );
}
