"use client";

import { useEffect } from "react";

import { usePlatformSettings, useUpdatePlatformSettingsMutation } from "@/features/platform/api";
import { platformSettingsFormSchema, PlatformSettingsFormValues } from "@/features/platform/schemas";
import { TenantOnboardingMode } from "@/features/tenant-requests/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { ApiError } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { FormInput } from "@/components/shared/form-input";
import { FormSelect } from "@/components/shared/form-select";
import { FormSwitch } from "@/components/shared/form-switch";
import { LoadingButton } from "@/components/shared/loading-button";

const modeOptions = [
    { value: TenantOnboardingMode.SELF_SIGNUP, label: "Self signup" },
    { value: TenantOnboardingMode.ADMIN_ONLY, label: "By request (admin creates organizations)" },
];

export const PlatformSettingsCard = () => {
    const { data: settings, isLoading } = usePlatformSettings();
    const updateSettings = useUpdatePlatformSettingsMutation();

    const { control, handleSubmit, reset, formState } = useForm<PlatformSettingsFormValues>({
        resolver: zodResolver(platformSettingsFormSchema),
        defaultValues: {
            tenantOnboardingMode: TenantOnboardingMode.SELF_SIGNUP,
            requireTenantApproval: true,
            maxTenantsPerUser: "5",
        },
    });

    useEffect(() => {
        if (settings) {
            reset({
                tenantOnboardingMode: settings.tenantOnboardingMode,
                requireTenantApproval: settings.requireTenantApproval,
                maxTenantsPerUser: String(settings.maxTenantsPerUser),
            });
        }
    }, [settings, reset]);

    const onSubmit = handleSubmit(async (values) => {
        try {
            await updateSettings.mutateAsync({ ...values, maxTenantsPerUser: Number(values.maxTenantsPerUser) });
            toast.add({ title: "Settings saved", type: "success" });
        } catch (error) {
            toast.add({
                title: "Couldn't save settings",
                description: error instanceof ApiError ? error.message : "Something went wrong",
                type: "error",
            });
        }
    });

    if (isLoading || !settings) return <Skeleton className="h-80 w-full" />;

    return (
        <Card className="shadow-card">
            <CardHeader>
                <CardTitle>Onboarding</CardTitle>
                <CardDescription>
                    Changes apply to new organizations only — existing ones keep the state they were created in.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} noValidate>
                    <FieldGroup>
                        <FormSelect
                            control={control}
                            name="tenantOnboardingMode"
                            label="How organizations are created"
                            options={modeOptions}
                        />
                        <FormSwitch
                            control={control}
                            name="requireTenantApproval"
                            label="Require approval"
                            description="New self-signup organizations wait for your approval before anyone can sign in."
                        />
                        <FormInput
                            control={control}
                            name="maxTenantsPerUser"
                            type="number"
                            min={1}
                            max={100}
                            label="Organizations per user"
                            placeholder="5"
                            description="How many organizations one person may own."
                        />
                        <LoadingButton
                            type="submit"
                            className="self-start"
                            isLoading={updateSettings.isPending}
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
