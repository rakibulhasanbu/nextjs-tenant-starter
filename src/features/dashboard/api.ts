import { AdminUser, AdminUserSession, MembershipStatus } from "@/features/dashboard/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch, apiFetchPaginated, QueryParams } from "@/lib/api-client";

export const adminUsersKeys = {
    all: ["admin-users"] as const,
    list: (params: QueryParams) => [...adminUsersKeys.all, "list", params] as const,
    detail: (id: string) => [...adminUsersKeys.all, "detail", id] as const,
    sessions: (id: string) => [...adminUsersKeys.all, "detail", id, "sessions"] as const,
};

export const useAdminUsers = (params: QueryParams) =>
    useQuery({
        queryKey: adminUsersKeys.list(params),
        queryFn: () => apiFetchPaginated<AdminUser>("/admin/users", { params }),
    });

/** Cheap way to derive a count without an aggregate endpoint: read `.total` from a 1-row page. */
export const useAdminUsersCount = (params: QueryParams = {}) => useAdminUsers({ ...params, page: 1, limit: 1 });

export const useAdminUser = (id: string) =>
    useQuery({
        queryKey: adminUsersKeys.detail(id),
        queryFn: () => apiFetch<AdminUser>(`/admin/users/${id}`),
        enabled: !!id,
    });

export const useAdminUserSessions = (id: string) =>
    useQuery({
        queryKey: adminUsersKeys.sessions(id),
        queryFn: () => apiFetch<AdminUserSession[]>(`/admin/users/${id}/sessions`),
        enabled: !!id,
    });

const useInvalidateAdminUsers = () => {
    const queryClient = useQueryClient();
    return (id?: string) => {
        queryClient.invalidateQueries({ queryKey: adminUsersKeys.all });
        if (id) queryClient.invalidateQueries({ queryKey: adminUsersKeys.detail(id) });
    };
};

/**
 * Identity is global, so a tenant admin can't edit the account itself — only the
 * member's roles, behind their own `role:assign` permission and endpoint, which
 * replaces the whole set (the backend always re-adds the baseline `user` role).
 */
export const useAssignUserRolesMutation = (id: string) => {
    const invalidate = useInvalidateAdminUsers();
    return useMutation({
        mutationFn: (roleIds: string[]) =>
            apiFetch<AdminUser>(`/admin/users/${id}/roles`, { method: "PATCH", body: { roleIds } }),
        onSuccess: () => invalidate(id),
    });
};

export const useUpdateUserStatusMutation = () => {
    const invalidate = useInvalidateAdminUsers();
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: MembershipStatus }) =>
            apiFetch<AdminUser>(`/admin/users/${id}/status`, { method: "PATCH", body: { status } }),
        onSuccess: (_data, vars) => invalidate(vars.id),
    });
};

export const useTriggerPasswordResetMutation = () =>
    useMutation({
        mutationFn: (id: string) => apiFetch<void>(`/admin/users/${id}/reset-password`, { method: "POST" }),
    });

export const useRevokeAdminUserSessionMutation = (userId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (sessionId: string) =>
            apiFetch<void>(`/admin/users/${userId}/sessions/${sessionId}`, { method: "DELETE" }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: adminUsersKeys.sessions(userId) }),
    });
};

export const useRevokeAllAdminUserSessionsMutation = (userId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => apiFetch<void>(`/admin/users/${userId}/sessions`, { method: "DELETE" }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: adminUsersKeys.sessions(userId) }),
    });
};

/**
 * Adds the invitee to this organization: a new address gets an account plus a
 * password-reset code email, an existing account is simply added as a member.
 * The backend always re-adds the baseline `user` role, so `roleIds` only needs
 * to carry the elevated role, if any.
 */
export const useInviteUserMutation = () => {
    const invalidate = useInvalidateAdminUsers();
    return useMutation({
        mutationFn: ({ email, roleIds }: { email: string; roleIds: string[] }) =>
            apiFetch<AdminUser>("/admin/users/invite", { method: "POST", body: { email, roleIds } }),
        onSuccess: () => invalidate(),
    });
};
