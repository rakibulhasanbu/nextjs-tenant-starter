"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { login2faVerifyAction } from "@/features/auth/actions";
import { useSessionOutcome } from "@/features/auth/hooks/use-session-outcome";
import {
    twoFactorRecoveryFormSchema,
    TwoFactorRecoveryFormValues,
    twoFactorVerifyFormSchema,
    TwoFactorVerifyFormValues,
} from "@/features/auth/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { FormInput } from "@/components/shared/form-input";
import { FormOTPInput } from "@/components/shared/form-OTP-input";
import { LoadingButton } from "@/components/shared/loading-button";

type TwoFactorVerifyFormProps = {
    twoFactorToken?: string;
    callbackUrl?: string;
};

/** Second step of sign-in for accounts with 2FA enabled — consumes a TOTP code or a one-time recovery code. */
export const TwoFactorVerifyForm = ({ twoFactorToken, callbackUrl }: TwoFactorVerifyFormProps) => {
    const finishSession = useSessionOutcome();
    const searchParams = useSearchParams();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [useRecoveryCode, setUseRecoveryCode] = useState(false);

    const codeForm = useForm<TwoFactorVerifyFormValues>({
        resolver: zodResolver(twoFactorVerifyFormSchema),
        defaultValues: { code: "" },
    });

    const recoveryForm = useForm<TwoFactorRecoveryFormValues>({
        resolver: zodResolver(twoFactorRecoveryFormSchema),
        defaultValues: { recoveryCode: "" },
    });

    const resolvedCallbackUrl = callbackUrl || searchParams.get("callbackUrl") || "/";

    const handleSuccess = (result: Awaited<ReturnType<typeof login2faVerifyAction>>) => {
        finishSession(result, { callbackUrl: resolvedCallbackUrl, errorTitle: "Verification failed" });
    };

    const onSubmitCode = codeForm.handleSubmit(async (values) => {
        if (!twoFactorToken) return;
        setIsSubmitting(true);
        const result = await login2faVerifyAction({ twoFactorToken, code: values.code });
        setIsSubmitting(false);
        handleSuccess(result);
    });

    const onSubmitRecovery = recoveryForm.handleSubmit(async (values) => {
        if (!twoFactorToken) return;
        setIsSubmitting(true);
        const result = await login2faVerifyAction({ twoFactorToken, recoveryCode: values.recoveryCode });
        setIsSubmitting(false);
        handleSuccess(result);
    });

    if (!twoFactorToken) {
        return (
            <FieldGroup>
                <p className="text-sm text-muted-foreground">
                    This verification link is invalid or has expired. Please sign in again.
                </p>
            </FieldGroup>
        );
    }

    if (useRecoveryCode) {
        return (
            <form onSubmit={onSubmitRecovery} noValidate>
                <FieldGroup>
                    <FormInput
                        control={recoveryForm.control}
                        name="recoveryCode"
                        type="text"
                        label="Recovery code"
                        placeholder="Enter one of your recovery codes"
                        autoComplete="one-time-code"
                        required
                    />
                    <LoadingButton type="submit" className="w-full" isLoading={isSubmitting}>
                        Verify
                    </LoadingButton>
                    <Button
                        type="button"
                        variant="link"
                        className="h-auto self-start p-0"
                        onClick={() => setUseRecoveryCode(false)}
                    >
                        Use an authenticator code instead
                    </Button>
                </FieldGroup>
            </form>
        );
    }

    return (
        <form onSubmit={onSubmitCode} noValidate>
            <FieldGroup>
                <FormOTPInput control={codeForm.control} name="code" length={6} pattern="\d*" />
                <LoadingButton type="submit" className="w-full" isLoading={isSubmitting}>
                    Verify
                </LoadingButton>
                <Button
                    type="button"
                    variant="link"
                    className="h-auto self-start p-0"
                    onClick={() => setUseRecoveryCode(true)}
                >
                    Use a recovery code instead
                </Button>
            </FieldGroup>
        </form>
    );
};
