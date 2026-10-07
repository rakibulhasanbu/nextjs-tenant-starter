"use client";

import { useState } from "react";

import { acceptInviteAction } from "@/features/auth/actions";
import { useSessionOutcome } from "@/features/auth/hooks/use-session-outcome";
import { acceptInviteFormSchema, AcceptInviteFormValues } from "@/features/auth/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FieldGroup } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { FormInput } from "@/components/shared/form-input";
import { LoadingButton } from "@/components/shared/loading-button";

/** Redeems the emailed invitation link: the token names the organization, the user only chooses a password. */
export const AcceptInviteForm = ({ token }: { token?: string }) => {
    const finishSession = useSessionOutcome();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { control, handleSubmit } = useForm<AcceptInviteFormValues>({
        resolver: zodResolver(acceptInviteFormSchema),
        defaultValues: { password: "", confirmPassword: "" },
    });

    const onSubmit = handleSubmit(async (values) => {
        if (!token) return;
        setIsSubmitting(true);
        const result = await acceptInviteAction(token, values.password);
        setIsSubmitting(false);

        if (finishSession(result, { errorTitle: "Couldn't accept invitation" }) && result.status !== "error") {
            toast.add({ title: "Welcome aboard", type: "success" });
        }
    });

    if (!token) {
        return (
            <p className="text-sm text-muted-foreground">
                This invitation link is invalid or has expired. Ask for a new one.
            </p>
        );
    }

    return (
        <form onSubmit={onSubmit} noValidate>
            <FieldGroup>
                <FormInput
                    control={control}
                    name="password"
                    type="password"
                    label="Password"
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    required
                />
                <FormInput
                    control={control}
                    name="confirmPassword"
                    type="password"
                    label="Confirm password"
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    required
                />
                <LoadingButton type="submit" className="w-full" isLoading={isSubmitting}>
                    Accept invitation
                </LoadingButton>
            </FieldGroup>
        </form>
    );
};
