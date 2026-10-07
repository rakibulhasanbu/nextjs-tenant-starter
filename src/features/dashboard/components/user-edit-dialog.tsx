"use client";

import { useEffect } from "react";

import { ROLE_IDS } from "@/features/auth/types";
import { useAssignUserRolesMutation } from "@/features/dashboard/api";
import { assignRolesFormSchema, AssignRolesFormValues } from "@/features/dashboard/schemas";
import { AdminUser } from "@/features/dashboard/types";
import { RoleCheckboxList } from "@/features/roles/components/role-checkbox-list";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { LoadingButton } from "@/components/shared/loading-button";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";

type UserEditDialogProps = {
    user: AdminUser | null;
    onOpenChange: (open: boolean) => void;
};

/** The elevated roles the form can grant or revoke; `user` is the baseline everyone keeps. */
const elevatedRoleIds = (user: AdminUser | null) => (user?.roleIds ?? []).filter((roleId) => roleId !== ROLE_IDS.USER);

/** Roles are all a tenant admin may change about a member — the account itself belongs to the user. */
export const UserEditDialog = ({ user, onOpenChange }: UserEditDialogProps) => {
    const { control, handleSubmit, reset, formState } = useForm<AssignRolesFormValues>({
        resolver: zodResolver(assignRolesFormSchema),
        defaultValues: { roleIds: [] },
    });

    useEffect(() => {
        if (user) reset({ roleIds: elevatedRoleIds(user) });
    }, [user, reset]);

    const assignRoles = useAssignUserRolesMutation(user?.id ?? "");

    const onSubmit = handleSubmit(async (values) => {
        try {
            await assignRoles.mutateAsync(values.roleIds);
            toast.add({ title: "Roles updated" });
            onOpenChange(false);
        } catch (error) {
            toast.add({
                title: "Update failed",
                description: error instanceof ApiError ? error.message : "Something went wrong",
                type: "error",
            });
        }
    });

    return (
        <ResponsiveDialog
            open={!!user}
            onOpenChange={onOpenChange}
            title="Manage roles"
            description={user ? `Choose what ${user.email} can do in this organization` : undefined}
            footer={
                <>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <LoadingButton onClick={onSubmit} isLoading={formState.isSubmitting}>
                        Save changes
                    </LoadingButton>
                </>
            }
        >
            <form onSubmit={onSubmit} noValidate>
                <FieldGroup>
                    <Controller
                        control={control}
                        name="roleIds"
                        render={({ field }) => <RoleCheckboxList value={field.value} onChange={field.onChange} />}
                    />
                </FieldGroup>
            </form>
        </ResponsiveDialog>
    );
};
