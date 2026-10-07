"use client";

import React, { useEffect, useRef } from "react";

import { SessionTenant, User } from "@/features/auth/types";
import { useAuthStore } from "@/store/auth-store";

type Props = {
    children: React.ReactNode;
    accessToken?: string;
    refreshToken?: string;
    user?: User;
    tenant?: SessionTenant | null;
};

export const TokenInitiatorInStore = ({ children, accessToken, refreshToken, user, tenant }: Props) => {
    const setTokens = useAuthStore((state) => state.setTokens);
    const setUser = useAuthStore((state) => state.setUser);
    const setTenant = useAuthStore((state) => state.setTenant);
    const setState = useAuthStore((state) => state.setState);
    const hasInitialized = useRef(false);

    useEffect(() => {
        if (hasInitialized.current) return;

        if (accessToken && refreshToken) {
            setTokens({ accessToken, refreshToken });
            if (user) {
                setUser(user);
            }
            setTenant(tenant ?? null);
        } else {
            setState("success");
        }

        hasInitialized.current = true;
    }, [accessToken, refreshToken, user, tenant, setTokens, setUser, setTenant, setState]);

    return <>{children}</>;
};
