"use client";

import { useEffect } from "react";

import { useCreatePlatformTenantMutation } from "@/features/platform/api";
import { createPlatformTenantFormSchema, CreatePlatformTenantFormValues } from "@/features/platform/schemas";
import { TenantRequest } from "@/features/tenant-requests/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { FormInput } from "@/components/shared/form-input";
import { LoadingButton } from "@/components/shared/loading-button";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";

const slugify = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 32);

type CreatePlatformTenantDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** An approved request to convert: its email becomes the owner, its business name the suggested name. */
    request?: TenantRequest | null;
};

/** Creates an ACTIVE organization and emails its owner an invitation link. */
export const CreatePlatformTenantDialog = ({ open, onOpenChange, request }: CreatePlatformTenantDialogProps) => {
    const createTenant = useCreatePlatformTenantMutation();

    const { control, handleSubmit, reset, setError } = useForm<CreatePlatformTenantFormValues>({
        resolver: zodResolver(createPlatformTenantFormSchema),
        defaultValues: { name: "", slug: "", ownerEmail: "" },
    });

    useEffect(() => {
        if (!open) return;
        reset({
            name: request?.businessName ?? "",
            slug: request ? slugify(request.businessName) : "",
            ownerEmail: request?.email ?? "",
        });
    }, [open, request, reset]);

    const onSubmit = handleSubmit(async (values) => {
        if (!request && !values.ownerEmail) {
            setError("ownerEmail", { message: "Owner email is required" });
            return;
        }

        try {
            const result = await createTenant.mutateAsync({
                name: values.name,
                slug: values.slug,
                requestId: request?.id,
                ownerEmail: request ? undefined : values.ownerEmail,
            });
            toast.add({
                title: "Organization created",
                description: result.inviteSent
                    ? `An invitation was sent to ${result.owner.email}.`
                    : "The invitation email failed — resend it from the organization's menu.",
                type: result.inviteSent ? "success" : "warning",
            });
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
            title="Create organization"
            description="It starts active, and the owner gets an email to set a password."
            footer={
                <>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <LoadingButton onClick={onSubmit} isLoading={createTenant.isPending}>
                        Create and invite
                    </LoadingButton>
                </>
            }
        >
            <form onSubmit={onSubmit} noValidate>
                <FieldGroup>
                    <FormInput control={control} name="name" label="Name" placeholder="Acme Inc." required />
                    <FormInput control={control} name="slug" label="Subdomain" placeholder="acme" required />
                    <FormInput
                        control={control}
                        name="ownerEmail"
                        type="email"
                        label="Owner email"
                        placeholder="owner@example.com"
                        readOnly={!!request}
                        required={!request}
                    />
                </FieldGroup>
            </form>
        </ResponsiveDialog>
    );
};
