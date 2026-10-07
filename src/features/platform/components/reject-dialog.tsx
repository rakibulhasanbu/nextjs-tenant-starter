"use client";

import { rejectFormSchema, RejectFormValues } from "@/features/platform/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { FormTextarea } from "@/components/shared/form-textarea";
import { LoadingButton } from "@/components/shared/loading-button";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";

type RejectDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    isLoading: boolean;
    onConfirm: (reason: string | undefined) => Promise<void>;
};

/** Rejecting takes an optional reason, which the applicant sees. */
export const RejectDialog = ({ open, onOpenChange, title, description, isLoading, onConfirm }: RejectDialogProps) => {
    const { control, handleSubmit, reset } = useForm<RejectFormValues>({
        resolver: zodResolver(rejectFormSchema),
        defaultValues: { reason: "" },
    });

    const onSubmit = handleSubmit(async (values) => {
        await onConfirm(values.reason || undefined);
        reset();
    });

    return (
        <ResponsiveDialog
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            description={description}
            footer={
                <>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <LoadingButton variant="destructive" onClick={onSubmit} isLoading={isLoading}>
                        Reject
                    </LoadingButton>
                </>
            }
        >
            <form onSubmit={onSubmit} noValidate>
                <FieldGroup>
                    <FormTextarea
                        control={control}
                        name="reason"
                        label="Reason (optional)"
                        placeholder="Why it was not approved"
                    />
                </FieldGroup>
            </form>
        </ResponsiveDialog>
    );
};
