import { CreateTenantFormValues, UpdateTenantFormValues } from "@/features/tenant/schemas";
import { MyTenant, Tenant, TenantSwitch } from "@/features/tenant/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";

export const tenantKeys = {
    current: ["tenant", "current"] as const,
    mine: ["tenant", "mine"] as const,
};

export const useTenant = () =>
    useQuery({
        queryKey: tenantKeys.current,
        queryFn: () => apiFetch<Tenant>("/tenant"),
    });

export const useUpdateTenantMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: UpdateTenantFormValues) => apiFetch<Tenant>("/tenant", { method: "PATCH", body: data }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: tenantKeys.current }),
    });
};

export const useMyTenants = () =>
    useQuery({
        queryKey: tenantKeys.mine,
        queryFn: () => apiFetch<MyTenant[]>("/me/tenants"),
    });

/** Starts another organization for the signed-in user (no new account); it may wait for approval. */
export const useCreateTenantMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateTenantFormValues) => apiFetch<Tenant>("/tenants", { method: "POST", body: data }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: tenantKeys.mine }),
    });
};

/** Returns a one-time code to redeem on the target organization's own host (`/auth/exchange`). */
export const useSwitchTenantMutation = () =>
    useMutation({
        mutationFn: (tenantSlug: string) =>
            apiFetch<TenantSwitch>("/auth/switch-tenant", { method: "POST", body: { tenantSlug } }),
    });
