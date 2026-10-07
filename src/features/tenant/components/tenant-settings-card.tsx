"use client";

import { useEffect } from "react";

import { useTenant, useUpdateTenantMutation } from "@/features/tenant/api";
import { updateTenantFormSchema, UpdateTenantFormValues } from "@/features/tenant/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { ApiError } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { FormInput } from "@/components/shared/form-input";
import { LoadingButton } from "@/components/shared/loading-button";

export const TenantSettingsCard = () => {
    const { data: tenant, isLoading } = useTenant();
    const updateTenant = useUpdateTenantMutation();

    const { control, handleSubmit, reset, formState } = useForm<UpdateTenantFormValues>({
        resolver: zodResolver(updateTenantFormSchema),
        defaultValues: { name: "" },
    });

    useEffect(() => {
        if (tenant) reset({ name: tenant.name });
    }, [tenant, reset]);

    const onSubmit = handleSubmit(async (values) => {
        try {
            await updateTenant.mutateAsync(values);
            toast.add({ title: "Organization updated", type: "success" });
        } catch (error) {
            toast.add({
                title: "Update failed",
                description: error instanceof ApiError ? error.message : "Something went wrong",
                type: "error",
            });
        }
    });

    if (isLoading || !tenant) return <Skeleton className="h-64 w-full" />;

    return (
        <Card className="shadow-card">
            <CardHeader>
                <CardTitle>Details</CardTitle>
                <CardDescription>The address is permanent; only the display name can change.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} noValidate>
                    <FieldGroup>
                        <FormInput control={control} name="name" label="Name" placeholder="Acme Inc." required />
                        <div className="flex flex-col gap-1.5">
                            <span className="text-sm font-medium">Address</span>
                            <span className="text-sm text-muted-foreground">{tenant.url}</span>
                        </div>
                        <LoadingButton
                            type="submit"
                            className="self-start"
                            isLoading={updateTenant.isPending}
                            disabled={!formState.isDirty}
                        >
                            Save changes
                        </LoadingButton>
                    </FieldGroup>
                </form>
            </CardContent>
        </Card>
    );
};
