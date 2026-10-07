import { z } from "zod";

/** Mirrors the backend's slug rule: 3-32 chars, lowercase letters/digits/hyphens, no leading/trailing hyphen. */
export const tenantSlugSchema = z
    .string()
    .regex(
        /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/,
        "3-32 characters: lowercase letters, digits and hyphens, not starting or ending with a hyphen"
    );

export const signInFormSchema = z.object({
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    password: z.string().min(1, "Password is required"),
    // Only shown on the apex, where there is no subdomain to say which organization to enter.
    tenantSlug: tenantSlugSchema.optional().or(z.literal("")),
});

export type SignInFormValues = z.infer<typeof signInFormSchema>;

export const signUpFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    phone: z.string().optional().or(z.literal("")),
    password: z.string().min(8, "Password must be at least 8 characters"),
    tenantName: z.string().trim().min(2, "Organization name is required").max(100),
    tenantSlug: tenantSlugSchema,
});

export type SignUpFormValues = z.infer<typeof signUpFormSchema>;

export const forgotFormSchema = z.object({
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});

export type ForgotFormValues = z.infer<typeof forgotFormSchema>;

export const otpCodeSchema = z
    .string()
    .length(6, "Enter the 6-digit code")
    .regex(/^\d{6}$/, "Code must be numeric");

export const verifyEmailFormSchema = z.object({
    code: otpCodeSchema,
});

export type VerifyEmailFormValues = z.infer<typeof verifyEmailFormSchema>;

export const twoFactorVerifyFormSchema = z.object({
    code: otpCodeSchema,
});

export type TwoFactorVerifyFormValues = z.infer<typeof twoFactorVerifyFormSchema>;

export const twoFactorRecoveryFormSchema = z.object({
    recoveryCode: z.string().min(1, "Recovery code is required"),
});

export type TwoFactorRecoveryFormValues = z.infer<typeof twoFactorRecoveryFormSchema>;

export const newPasswordFormSchema = z
    .object({
        code: otpCodeSchema,
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string().min(1, "Confirm your password"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export type NewPasswordFormValues = z.infer<typeof newPasswordFormSchema>;

export const reactivateAccountFormSchema = z.object({
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    code: otpCodeSchema,
});

export type ReactivateAccountFormValues = z.infer<typeof reactivateAccountFormSchema>;

export const setPasswordFormSchema = z
    .object({
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string().min(1, "Confirm your password"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export type SetPasswordFormValues = z.infer<typeof setPasswordFormSchema>;

export const acceptInviteFormSchema = z
    .object({
        password: z.string().min(8, "Password must be at least 8 characters").max(72),
        confirmPassword: z.string().min(1, "Confirm your password"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export type AcceptInviteFormValues = z.infer<typeof acceptInviteFormSchema>;
