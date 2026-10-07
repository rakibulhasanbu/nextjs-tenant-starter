import { logoutAction, revalidateTokensAction } from "@/features/auth/actions";
import { SessionTenant, User } from "@/features/auth/types";
import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";

const STORE_KEY = "temp_auth";

const noopStorage: StateStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
};

type AuthState = {
    user: User | null;
    /** The organization this session acts in; `null` on the platform host. */
    tenant: SessionTenant | null;

    state: "loading" | "success"; // TODO: Rethink about this

    accessToken: string | null;
    refreshToken: string | null;
};

type AuthActions = {
    setUser: (user: User) => void;
    setTenant: (tenant: SessionTenant | null) => void;
    setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
    setState: (state: AuthState["state"]) => void;
    setTokensAndRevalidate: (tokens: { accessToken: string; refreshToken: string }) => Promise<void>;
    logout: () => Promise<void>;
    logoutWithReload: () => Promise<void>;
};

const initialState: AuthState = {
    user: null,
    tenant: null,
    state: "loading",
    accessToken: null,
    refreshToken: null,
};

export const useAuthStore = create<AuthState & AuthActions>()(
    persist(
        (set, get) => ({
            ...initialState,

            setUser: (user) => set({ user, state: "success" }),

            setTenant: (tenant) => set({ tenant }),

            setTokens: (tokens) => set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),

            setState: (state) => set({ state }),

            setTokensAndRevalidate: async (tokens) => {
                get().setTokens(tokens);
                // The action re-reads /users/me while rewriting the cookies, so this is
                // also where a role or status change reaches the client-side gates.
                const user = await revalidateTokensAction(tokens.accessToken, tokens.refreshToken);
                if (user) set({ user });
            },

            logout: async () => {
                await logoutAction();
                set({ user: null, tenant: null, accessToken: null, refreshToken: null });
            },

            logoutWithReload: async () => {
                await get().logout();
                window.location.reload();
            },
        }),
        {
            name: STORE_KEY,
            storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : noopStorage)),
            partialize: (state) => ({
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                user: state.user,
                tenant: state.tenant,
            }),
        }
    )
);
