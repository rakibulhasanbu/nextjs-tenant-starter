import { z } from "zod";

export const tenantRequestFormSchema = z.object({
    businessName: z.string().trim().min(2, "Business name is required").max(100),
    ownerName: z.string().trim().min(2, "Owner name is required").max(100),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    phone: z.string().trim().min(5, "Phone number is required").max(30),
    dateOfBirth: z
        .string()
        .min(1, "Date of birth is required")
        .refine((value) => new Date(value) < new Date(), "Date of birth must be in the past"),
    address: z.string().trim().min(5, "Address is required").max(300),
});

export type TenantRequestFormValues = z.infer<typeof tenantRequestFormSchema>;
