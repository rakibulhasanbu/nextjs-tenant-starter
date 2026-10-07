import {
    CreatePlatformTenantPayload,
    CreatePlatformTenantResult,
    PlatformSettings,
    PlatformTenant,
    UpdatePlatformSettingsPayload,
} from "@/features/platform/types";
import { TenantRequest } from "@/features/tenant-requests/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch, apiFetchPaginated, QueryParams } from "@/lib/api-client";

export const platformKeys = {
    tenants: ["platform", "tenants"] as const,
    tenantList: (params: QueryParams) => [...platformKeys.tenants, "list", params] as const,
    requests: ["platform", "requests"] as const,
    requestList: (params: QueryParams) => [...platformKeys.requests, "list", params] as const,
    settings: ["platform", "settings"] as const,
};

export const usePlatformTenants = (params: QueryParams) =>
    useQuery({
        queryKey: platformKeys.tenantList(params),
        queryFn: () => apiFetchPaginated<PlatformTenant>("/platform/tenants", { params }),
    });

export type TenantTransition = "approve" | "reject" | "suspend" | "reactivate";

export const useTenantTransitionMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, action, reason }: { id: string; action: TenantTransition; reason?: string }) =>
            apiFetch<PlatformTenant>(`/platform/tenants/${id}/${action}`, {
                method: "POST",
                body: action === "reject" ? { reason: reason || undefined } : undefined,
            }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: platformKeys.tenants }),
    });
};

export const useCreatePlatformTenantMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreatePlatformTenantPayload) =>
            apiFetch<CreatePlatformTenantResult>("/platform/tenants", { method: "POST", body: data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: platformKeys.tenants });
            queryClient.invalidateQueries({ queryKey: platformKeys.requests });
        },
    });
};

/** Re-issues the owner invitation; the old link stops working. 429 `INVITE_RESEND_COOLDOWN` when asked too soon. */
export const useResendOwnerInviteMutation = () =>
    useMutation({
        mutationFn: (tenantId: string) =>
            apiFetch<void>(`/platform/tenants/${tenantId}/resend-invite`, { method: "POST" }),
    });

export const usePlatformTenantRequests = (params: QueryParams) =>
    useQuery({
        queryKey: platformKeys.requestList(params),
        queryFn: () => apiFetchPaginated<TenantRequest>("/platform/tenant-requests", { params }),
    });

export const useTenantRequestDecisionMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, action, reason }: { id: string; action: "approve" | "reject"; reason?: string }) =>
            apiFetch<TenantRequest>(`/platform/tenant-requests/${id}/${action}`, {
                method: "POST",
                body: action === "reject" ? { reason: reason || undefined } : undefined,
            }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: platformKeys.requests }),
    });
};

export const usePlatformSettings = () =>
    useQuery({
        queryKey: platformKeys.settings,
        queryFn: () => apiFetch<PlatformSettings>("/platform/settings"),
    });

export const useUpdatePlatformSettingsMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: UpdatePlatformSettingsPayload) =>
            apiFetch<PlatformSettings>("/platform/settings", { method: "PATCH", body: data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: platformKeys.settings });
            // The public onboarding config the apex reads changes with the mode.
            queryClient.invalidateQueries({ queryKey: ["tenant-requests", "config"] });
        },
    });
};
