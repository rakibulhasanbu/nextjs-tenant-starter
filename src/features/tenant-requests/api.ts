import { TenantRequestFormValues } from "@/features/tenant-requests/schemas";
import { TenantRequestConfig } from "@/features/tenant-requests/types";
import { useMutation, useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";

export const tenantRequestKeys = {
    config: () => ["tenant-requests", "config"] as const,
};

export const useTenantRequestConfig = () =>
    useQuery({
        queryKey: tenantRequestKeys.config(),
        queryFn: () => apiFetch<TenantRequestConfig>("/tenant-requests/config", { skipAuth: true }),
        staleTime: 60_000,
    });

export const useCreateTenantRequestMutation = () =>
    useMutation({
        mutationFn: (data: TenantRequestFormValues) =>
            apiFetch<unknown>("/tenant-requests", { method: "POST", body: data, skipAuth: true }),
    });
