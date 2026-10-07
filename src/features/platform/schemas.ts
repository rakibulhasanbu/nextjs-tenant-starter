import { tenantSlugSchema } from "@/features/auth/schemas";
import { TenantOnboardingMode } from "@/features/tenant-requests/types";
import { z } from "zod";

export const createPlatformTenantFormSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    slug: tenantSlugSchema,
    // Optional only when a request supplies the owner's email.
    ownerEmail: z.string().email("Enter a valid email address").or(z.literal("")),
});

export type CreatePlatformTenantFormValues = z.infer<typeof createPlatformTenantFormSchema>;

export const rejectFormSchema = z.object({
    reason: z.string().trim().max(500).optional().or(z.literal("")),
});

export type RejectFormValues = z.infer<typeof rejectFormSchema>;

export const platformSettingsFormSchema = z.object({
    tenantOnboardingMode: z.enum(TenantOnboardingMode),
    requireTenantApproval: z.boolean(),
    // Kept as text because the input yields text; converted on submit.
    maxTenantsPerUser: z
        .string()
        .regex(/^\d+$/, "Enter a whole number")
        .refine((value) => Number(value) >= 1 && Number(value) <= 100, "Between 1 and 100"),
});

export type PlatformSettingsFormValues = z.infer<typeof platformSettingsFormSchema>;
