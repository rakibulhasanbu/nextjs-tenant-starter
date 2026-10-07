import { z } from "zod";

export const assignRolesFormSchema = z.object({
    // Elevated roles only; the backend re-adds the baseline `user` role and
    // refuses anything ranked at or above the actor's own.
    roleIds: z.array(z.string()),
});

export type AssignRolesFormValues = z.infer<typeof assignRolesFormSchema>;

export const inviteUserFormSchema = z.object({
    email: z.email("Enter a valid email"),
    roleIds: z.array(z.string()),
});

export type InviteUserFormValues = z.infer<typeof inviteUserFormSchema>;
