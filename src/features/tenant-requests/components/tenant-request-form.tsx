"use client";

import { useState } from "react";

import { useCreateTenantRequestMutation, useTenantRequestConfig } from "@/features/tenant-requests/api";
import { tenantRequestFormSchema, TenantRequestFormValues } from "@/features/tenant-requests/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardCheckIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import { ApiError } from "@/lib/api-client";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { FieldGroup } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { FormInput } from "@/components/shared/form-input";
import { FormPhoneInput } from "@/components/shared/form-phone-input";
import { FormTextarea } from "@/components/shared/form-textarea";
import { LinkButton } from "@/components/shared/link-button";
import { LoadingButton } from "@/components/shared/loading-button";

/** Registration request for `ADMIN_ONLY` platforms: the super admin reviews it, then creates the tenant and invites the owner. */
export const TenantRequestForm = () => {
    const { data: config, isLoading } = useTenantRequestConfig();
    const createRequest = useCreateTenantRequestMutation();
    const [submitted, setSubmitted] = useState(false);

    const { control, handleSubmit } = useForm<TenantRequestFormValues>({
        resolver: zodResolver(tenantRequestFormSchema),
        defaultValues: { businessName: "", ownerName: "", email: "", phone: "", dateOfBirth: "", address: "" },
    });

    const onSubmit = handleSubmit(async (values) => {
        try {
            await createRequest.mutateAsync(values);
            setSubmitted(true);
        } catch (error) {
            const description =
                error instanceof ApiError && error.code === "TENANT_REQUEST_ALREADY_OPEN"
                    ? "A request for this email is already waiting for review."
                    : error instanceof ApiError
                      ? error.message
                      : "Something went wrong";
            toast.add({ title: "Couldn't send request", description, type: "error" });
        }
    });

    if (isLoading) return <Skeleton className="h-64 w-full" />;

    if (submitted) {
        return (
            <Empty className="border-none p-0">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <ClipboardCheckIcon />
                    </EmptyMedia>
                    <EmptyTitle>Request received</EmptyTitle>
                    <EmptyDescription>
                        We&apos;ll review it and email you an invitation to set up your organization once it&apos;s
                        approved.
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    if (config && !config.registrationRequestEnabled) {
        return (
            <Empty className="border-none p-0">
                <EmptyHeader>
                    <EmptyTitle>Requests are closed</EmptyTitle>
                    <EmptyDescription>
                        {config.selfSignupEnabled
                            ? "You can create your organization yourself."
                            : "New organizations are not being accepted right now."}
                    </EmptyDescription>
                </EmptyHeader>
                {config.selfSignupEnabled && <LinkButton href="/auth/sign-up">Create an organization</LinkButton>}
            </Empty>
        );
    }

    return (
        <form onSubmit={onSubmit} noValidate>
            <FieldGroup>
                <FormInput
                    control={control}
                    name="businessName"
                    label="Business name"
                    placeholder="Acme Inc."
                    required
                />
                <FormInput control={control} name="ownerName" label="Owner name" placeholder="Jane Doe" required />
                <FormInput
                    control={control}
                    name="email"
                    type="email"
                    label="Email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                />
                <FormPhoneInput
                    control={control}
                    name="phone"
                    label="Phone number"
                    placeholder="Enter phone number"
                    autoComplete="tel"
                />
                <FormInput
                    control={control}
                    name="dateOfBirth"
                    type="date"
                    label="Date of birth"
                    placeholder=""
                    required
                />
                <FormTextarea
                    control={control}
                    name="address"
                    label="Address"
                    placeholder="Business address"
                    required
                />
                <LoadingButton type="submit" className="w-full" isLoading={createRequest.isPending}>
                    Request access
                </LoadingButton>
            </FieldGroup>
        </form>
    );
};
