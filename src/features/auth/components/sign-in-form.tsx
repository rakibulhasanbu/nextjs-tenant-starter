"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { loginAction } from "@/features/auth/actions";
import { TenantPicker } from "@/features/auth/components/tenant-picker";
import { useSessionOutcome } from "@/features/auth/hooks/use-session-outcome";
import { signInFormSchema, SignInFormValues } from "@/features/auth/schemas";
import { SelectableTenant } from "@/features/auth/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { HostKind } from "@/lib/host";
import { FieldGroup } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { FormInput } from "@/components/shared/form-input";
import { LinkButton } from "@/components/shared/link-button";
import { LoadingButton } from "@/components/shared/loading-button";

type SignInFormProps = {
    /** Only the apex has no subdomain to say which organization to enter, so only it asks. */
    hostKind: HostKind;
};

export const SignInForm = ({ hostKind }: SignInFormProps) => {
    const finishSession = useSessionOutcome();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selection, setSelection] = useState<{ selectionToken: string; tenants: SelectableTenant[] } | null>(null);

    const callbackUrl = searchParams.get("callbackUrl") || "/";

    const { control, handleSubmit } = useForm<SignInFormValues>({
        resolver: zodResolver(signInFormSchema),
        defaultValues: { email: "", password: "", tenantSlug: "" },
    });

    const onSubmit = handleSubmit(async (values) => {
        setIsSubmitting(true);
        const result = await loginAction(values.email, values.password, values.tenantSlug);
        setIsSubmitting(false);

        if (result.status === "twoFactorRequired") {
            const params = new URLSearchParams({ twoFactorToken: result.twoFactorToken });
            if (searchParams.get("callbackUrl")) params.set("callbackUrl", callbackUrl);
            router.push(`/auth/2fa-verify?${params.toString()}`);
            return;
        }

        if (result.status === "tenantSelection") {
            setSelection({ selectionToken: result.selectionToken, tenants: result.tenants });
            return;
        }

        if (result.status === "error") {
            // The backend has already emailed the reactivation code by the time it
            // answers with this — the user just needs somewhere to enter it.
            if (result.code === "ACCOUNT_PENDING_DELETION") {
                toast.add({
                    title: "Account scheduled for deletion",
                    description: "We sent you a code to restore it.",
                    type: "info",
                });
                const reactivateParams = new URLSearchParams({ email: values.email });
                if (result.graceEndsAt) reactivateParams.set("graceEndsAt", result.graceEndsAt);
                router.push(`/auth/reactivate-account?${reactivateParams.toString()}`);
                return;
            }

            if (result.code === "EMAIL_NOT_VERIFIED") {
                toast.add({ title: "Verify your email", description: "We sent you a new code.", type: "info" });
                const params = new URLSearchParams({ email: values.email });
                if (searchParams.get("callbackUrl")) params.set("callbackUrl", callbackUrl);
                if (values.tenantSlug) params.set("tenant", values.tenantSlug);
                router.push(`/auth/verify-email?${params.toString()}`);
                return;
            }
        }

        finishSession(result, { callbackUrl });
    });

    if (selection) {
        return <TenantPicker {...selection} callbackUrl={callbackUrl} />;
    }

    return (
        <form onSubmit={onSubmit} noValidate>
            <FieldGroup>
                {hostKind === "apex" && (
                    <FormInput
                        control={control}
                        name="tenantSlug"
                        type="text"
                        label="Organization"
                        placeholder="acme (optional)"
                        description="Leave empty to pick from your organizations."
                        autoComplete="organization"
                    />
                )}
                <FormInput
                    control={control}
                    name="email"
                    type="email"
                    label="Email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                />
                <div className="flex flex-col gap-2">
                    <FormInput
                        control={control}
                        name="password"
                        type="password"
                        label="Password"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                    />
                    <LinkButton href="/auth/forgot-password" variant="link" size="sm" className="h-auto self-end p-0">
                        Forgot password?
                    </LinkButton>
                </div>
                <LoadingButton type="submit" className="w-full" isLoading={isSubmitting}>
                    Sign in
                </LoadingButton>
            </FieldGroup>
        </form>
    );
};
