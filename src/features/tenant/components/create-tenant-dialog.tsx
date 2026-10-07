"use client";

import { TenantStatus } from "@/features/auth/types";
import { useCreateTenantMutation } from "@/features/tenant/api";
import { createTenantFormSchema, CreateTenantFormValues } from "@/features/tenant/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { FormInput } from "@/components/shared/form-input";
import { LoadingButton } from "@/components/shared/loading-button";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";

/** Another organization for the signed-in user. Whether it starts active or waits for approval is the platform's call. */
type CreateTenantDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export const CreateTenantDialog = ({ open, onOpenChange }: CreateTenantDialogProps) => {
    const createTenant = useCreateTenantMutation();

    const { control, handleSubmit, reset, setError } = useForm<CreateTenantFormValues>({
        resolver: zodResolver(createTenantFormSchema),
        defaultValues: { name: "", slug: "" },
    });

    const onSubmit = handleSubmit(async (values) => {
        try {
            const tenant = await createTenant.mutateAsync(values);
            toast.add({
                title: tenant.status === TenantStatus.ACTIVE ? "Organization created" : "Organization submitted",
                description:
                    tenant.status === TenantStatus.ACTIVE
                        ? "Open it from the organization menu."
                        : "It will be available once it's approved.",
                type: "success",
            });
            reset();
            onOpenChange(false);
        } catch (error) {
            if (
                error instanceof ApiError &&
                (error.code === "TENANT_SLUG_TAKEN" || error.code === "TENANT_SLUG_RESERVED")
            ) {
                setError("slug", { message: error.message });
                return;
            }
            toast.add({
                title: "Couldn't create organization",
                description: error instanceof ApiError ? error.message : "Something went wrong",
                type: "error",
            });
        }
    });

    return (
        <ResponsiveDialog
            open={open}
            onOpenChange={onOpenChange}
            title="New organization"
            description="You'll be its owner. The subdomain can't be changed later."
            footer={
                <>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <LoadingButton onClick={onSubmit} isLoading={createTenant.isPending}>
                        Create
                    </LoadingButton>
                </>
            }
        >
            <form onSubmit={onSubmit} noValidate>
                <FieldGroup>
                    <FormInput control={control} name="name" label="Name" placeholder="Acme Inc." required />
                    <FormInput control={control} name="slug" label="Subdomain" placeholder="acme" required />
                </FieldGroup>
            </form>
        </ResponsiveDialog>
    );
};
