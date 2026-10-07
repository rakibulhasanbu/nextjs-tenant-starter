"use client";

import { useState } from "react";

import { useMyTenants, useSwitchTenantMutation } from "@/features/tenant/api";
import { CreateTenantDialog } from "@/features/tenant/components/create-tenant-dialog";
import { isTenantEnterable } from "@/features/tenant/types";
import { useAuthStore } from "@/store/auth-store";
import { BuildingIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";

import { ApiError } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";

/** Lists the caller's organizations; opening one trades a one-time code for a session on that organization's host. */
export const OrgSwitcher = () => {
    const tenant = useAuthStore((state) => state.tenant);
    const { data: tenants } = useMyTenants();
    const switchTenant = useSwitchTenantMutation();
    const [switchingSlug, setSwitchingSlug] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);

    if (!tenant) return null;

    const onSwitch = async (slug: string) => {
        setSwitchingSlug(slug);
        try {
            const { tenant: target, exchangeCode } = await switchTenant.mutateAsync(slug);
            const url = new URL("/auth/exchange", target.url);
            url.searchParams.set("code", exchangeCode);
            window.location.assign(url.toString());
        } catch (error) {
            setSwitchingSlug(null);
            toast.add({
                title: "Couldn't switch organization",
                description: error instanceof ApiError ? error.message : "Something went wrong",
                type: "error",
            });
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <Button variant="outline" size="sm" className="max-w-56 justify-between gap-2">
                            <BuildingIcon data-icon="inline-start" />
                            <span className="truncate">{tenant.name}</span>
                            <ChevronsUpDownIcon data-icon="inline-end" />
                        </Button>
                    }
                />
                <DropdownMenuContent align="start" className="w-64">
                    <DropdownMenuLabel>Organizations</DropdownMenuLabel>
                    {(tenants ?? []).map((item) => {
                        const isCurrent = item.slug === tenant.slug;
                        return (
                            <DropdownMenuItem
                                key={item.id}
                                disabled={isCurrent || !isTenantEnterable(item) || switchingSlug !== null}
                                onClick={() => onSwitch(item.slug)}
                                className="justify-between gap-2"
                            >
                                <span className="truncate">{item.name}</span>
                                {isCurrent ? (
                                    <Badge variant="secondary">Current</Badge>
                                ) : !isTenantEnterable(item) ? (
                                    <Badge variant="outline">
                                        {item.status === "ACTIVE" ? "Suspended" : "Unavailable"}
                                    </Badge>
                                ) : null}
                            </DropdownMenuItem>
                        );
                    })}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setCreateOpen(true)}>
                        <PlusIcon />
                        New organization
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <CreateTenantDialog open={createOpen} onOpenChange={setCreateOpen} />
        </>
    );
};
