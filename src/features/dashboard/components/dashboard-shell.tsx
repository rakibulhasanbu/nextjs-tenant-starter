"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { allowedDashboardNavItems } from "@/features/dashboard/nav-config";
import { platformNavItems } from "@/features/platform/nav-config";
import { OrgSwitcher } from "@/features/tenant/components/org-switcher";
import { useAuthStore } from "@/store/auth-store";
import { LogOutIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Text } from "@/components/ui/text";
import { Logo } from "@/components/shared/logo";

type DashboardShellProps = {
    children: React.ReactNode;
    /** `platform` is the super admin console: its own nav, and no organization to switch between. */
    variant?: "tenant" | "platform";
};

export const DashboardShell = ({ children, variant = "tenant" }: DashboardShellProps) => {
    const pathname = usePathname();
    const user = useAuthStore((state) => state.user);
    const logoutWithReload = useAuthStore((state) => state.logoutWithReload);

    return (
        <SidebarProvider className="mx-auto max-w-480">
            <Sidebar collapsible="icon" className="data-[side=left]:left-[max(0px,calc((100%-120rem)/2))]">
                <SidebarHeader className="px-3 py-3">
                    <Logo size="sm" />
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {(variant === "platform"
                                    ? platformNavItems
                                    : allowedDashboardNavItems(user?.permissions)
                                ).map((item) => {
                                    const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`);
                                    const Icon = item.icon;
                                    return (
                                        <SidebarMenuItem key={item.url}>
                                            <SidebarMenuButton isActive={isActive} render={<Link href={item.url} />}>
                                                {Icon && <Icon />}
                                                <span>{item.title}</span>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter className="gap-2 px-3 py-3">
                    {user && (
                        <div className="flex flex-col overflow-hidden">
                            <Text variant="small" weight="medium" className="truncate">
                                {user.name || user.username}
                            </Text>
                            <Text variant="small" tone="muted" className="truncate">
                                {user.email}
                            </Text>
                        </div>
                    )}
                    <Button variant="outline" size="sm" onClick={() => logoutWithReload()}>
                        <LogOutIcon data-icon="inline-start" />
                        Sign out
                    </Button>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="flex items-center gap-2 border-b px-4 py-3">
                    <SidebarTrigger />
                    {variant === "tenant" && <OrgSwitcher />}
                </header>
                <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
};
