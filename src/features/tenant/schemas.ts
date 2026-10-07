import { tenantSlugSchema } from "@/features/auth/schemas";
import { z } from "zod";

export const updateTenantFormSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
});

export type UpdateTenantFormValues = z.infer<typeof updateTenantFormSchema>;

export const createTenantFormSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    slug: tenantSlugSchema,
});

export type CreateTenantFormValues = z.infer<typeof createTenantFormSchema>;
