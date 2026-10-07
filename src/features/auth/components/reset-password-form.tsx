"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { resetPasswordAction } from "@/features/auth/actions";
import { useSessionOutcome } from "@/features/auth/hooks/use-session-outcome";
import { newPasswordFormSchema, NewPasswordFormValues } from "@/features/auth/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FieldGroup } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { FormInput } from "@/components/shared/form-input";
import { FormOTPInput } from "@/components/shared/form-OTP-input";
import { LoadingButton } from "@/components/shared/loading-button";

interface ResetPasswordFormProps {
    email: string;
}

export const ResetPasswordForm = ({ email }: ResetPasswordFormProps) => {
    const finishSession = useSessionOutcome();
    const searchParams = useSearchParams();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { control, handleSubmit } = useForm<NewPasswordFormValues>({
        resolver: zodResolver(newPasswordFormSchema),
        defaultValues: { code: "", newPassword: "", confirmPassword: "" },
    });

    const onSubmit = handleSubmit(async (values) => {
        setIsSubmitting(true);
        const result = await resetPasswordAction({ email, code: values.code, password: values.newPassword });
        setIsSubmitting(false);

        const callbackUrl = searchParams.get("callbackUrl") || "/";
        if (
            finishSession(result, { callbackUrl, errorTitle: "Couldn't reset password" }) &&
            result.status !== "error"
        ) {
            toast.add({ title: "Password reset", type: "success" });
        }
    });

    return (
        <form onSubmit={onSubmit} noValidate>
            <FieldGroup>
                <FormOTPInput
                    control={control}
                    name="code"
                    length={6}
                    pattern="\d*"
                    label="Verification code"
                    description={`Enter the 6-digit code sent to ${email}`}
                />
                <FormInput
                    control={control}
                    name="newPassword"
                    type="password"
                    label="New password"
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    required
                />
                <FormInput
                    control={control}
                    name="confirmPassword"
                    type="password"
                    label="Confirm new password"
                    placeholder="Re-enter your new password"
                    autoComplete="new-password"
                    required
                />
                <LoadingButton type="submit" className="w-full" isLoading={isSubmitting}>
                    Reset password
                </LoadingButton>
            </FieldGroup>
        </form>
    );
};
