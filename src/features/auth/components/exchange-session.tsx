"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { exchangeCodeAction } from "@/features/auth/actions";
import { useSessionOutcome } from "@/features/auth/hooks/use-session-outcome";

import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";

/** Landing spot of an apex sign-in or an organization switch: redeems the one-time code, then enters the app. */
export const ExchangeSession = ({ code }: { code?: string }) => {
    const finishSession = useSessionOutcome();
    const router = useRouter();
    // The code is single-use, so React strict mode's second effect run must not spend it twice.
    const started = useRef(false);

    useEffect(() => {
        if (started.current) return;
        started.current = true;

        if (!code) {
            router.replace("/auth/sign-in");
            return;
        }

        exchangeCodeAction(code).then((result) => {
            if (result.status === "error") {
                // Expired or reused code: the user simply signs in here instead.
                if (!finishSession(result, { errorTitle: "Couldn't continue" })) router.replace("/auth/sign-in");
                return;
            }
            finishSession(result);
        });
    }, [code, finishSession, router]);

    return (
        <div className="flex flex-col gap-3">
            <Text variant="small" tone="muted">
                Signing you in...
            </Text>
            <Skeleton className="h-10 w-full" />
        </div>
    );
};
