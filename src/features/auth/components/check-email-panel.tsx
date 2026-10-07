"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { resendVerificationAction, verifyEmailAction } from "@/features/auth/actions";
import { useSessionOutcome } from "@/features/auth/hooks/use-session-outcome";
import { verifyEmailFormSchema, VerifyEmailFormValues } from "@/features/auth/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { FieldGroup } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { FormOTPInput } from "@/components/shared/form-OTP-input";
import { LoadingButton } from "@/components/shared/loading-button";

const RESEND_COOLDOWN_SECONDS = 60;

type CheckEmailPanelProps = {
    email?: string;
    /** The organization created at sign-up; names where to sign in when verifying on the apex. */
    tenantSlug?: string;
};

/** Shown right after registration (or a login attempt while unverified) — enters the emailed 6-digit code. */
export const CheckEmailPanel = ({ email, tenantSlug }: CheckEmailPanelProps) => {
    const finishSession = useSessionOutcome();
    const searchParams = useSearchParams();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

    const { control, handleSubmit } = useForm<VerifyEmailFormValues>({
        resolver: zodResolver(verifyEmailFormSchema),
        defaultValues: { code: "" },
    });

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    const onSubmit = handleSubmit(async (values) => {
        if (!email) return;

        setIsSubmitting(true);
        const result = await verifyEmailAction(email, values.code, tenantSlug);
        setIsSubmitting(false);

        const callbackUrl = searchParams.get("callbackUrl") || "/";
        if (finishSession(result, { callbackUrl, errorTitle: "Verification failed" }) && result.status !== "error") {
            toast.add({ title: "Email verified", type: "success" });
        }
    });

    const onResend = async () => {
        if (!email || cooldown > 0) return;

        setIsResending(true);
        const result = await resendVerificationAction(email);
        setIsResending(false);

        if (result.status === "error") {
            toast.add({ title: "Couldn't resend the code", description: result.error, type: "error" });
            return;
        }

        toast.add({ title: "Verification code resent", type: "success" });
        setCooldown(RESEND_COOLDOWN_SECONDS);
    };

    return (
        <div className="flex flex-col gap-6">
            <Empty className="border-none p-0">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <MailIcon />
                    </EmptyMedia>
                    <EmptyTitle>Check your email</EmptyTitle>
                    <EmptyDescription>
                        {email ? (
                            <>
                                We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>.
                                Enter it below to activate your account.
                            </>
                        ) : (
                            "We sent you a 6-digit code. Enter it below to activate your account."
                        )}
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
            <form onSubmit={onSubmit} noValidate>
                <FieldGroup>
                    <FormOTPInput control={control} name="code" length={6} pattern="\d*" disabled={!email} />
                    <LoadingButton type="submit" className="w-full" isLoading={isSubmitting} disabled={!email}>
                        Verify email
                    </LoadingButton>
                </FieldGroup>
            </form>
            <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={!email || isResending || cooldown > 0}
                onClick={onResend}
            >
                {cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
            </Button>
        </div>
    );
};
