"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { canViewDashboard as hasDashboardAccess, hasPermission, PERMISSIONS } from "@/features/auth/types";
import { useAuthStore } from "@/store/auth-store";
import { LayoutDashboardIcon, LogOutIcon, MenuIcon, SettingsIcon, UserIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Text } from "@/components/ui/text";
import { LinkButton } from "@/components/shared/link-button";
import { LoadingButton } from "@/components/shared/loading-button";
import { Logo } from "@/components/shared/logo";

const initials = (name: string) =>
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");

export const SiteNavbar = () => {
    const pathname = usePathname();
    const user = useAuthStore((state) => state.user);
    const logoutWithReload = useAuthStore((state) => state.logoutWithReload);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    if (
        ["/dashboard", "/platform", "/auth", "/register", "/accept-invite"].some((prefix) =>
            pathname?.startsWith(prefix)
        )
    ) {
        return null;
    }

    // The console is the super admin's home; everyone else gets the organization dashboard if they hold any admin permission.
    const isPlatformAdmin = hasPermission(user?.permissions, PERMISSIONS.PLATFORM_TENANT_READ);
    const canViewDashboard = !isPlatformAdmin && hasDashboardAccess(user?.permissions);
    const displayName = user ? user.name || user.username : "";

    const handleSignOut = async () => {
        setIsLoggingOut(true);
        await logoutWithReload();
    };

    return (
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
            <nav className="layout flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <Logo size="sm" />
                </Link>

                <div className="hidden items-center gap-3 md:flex">
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
                                <Avatar>
                                    {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={displayName} />}
                                    <AvatarFallback>{initials(displayName)}</AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-56">
                                <DropdownMenuGroup>
                                    <DropdownMenuLabel className="flex flex-col gap-0.5 px-1.5 py-1.5">
                                        <Text variant="small" weight="medium" className="text-foreground">
                                            {displayName}
                                        </Text>
                                        <Text variant="small" tone="muted" className="truncate">
                                            {user.email}
                                        </Text>
                                    </DropdownMenuLabel>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                {isPlatformAdmin && (
                                    <DropdownMenuItem render={<Link href="/platform" />}>
                                        <LayoutDashboardIcon />
                                        Console
                                    </DropdownMenuItem>
                                )}
                                {canViewDashboard && (
                                    <DropdownMenuItem render={<Link href="/dashboard" />}>
                                        <LayoutDashboardIcon />
                                        Dashboard
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem render={<Link href="/account" />}>
                                    <UserIcon />
                                    Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem render={<Link href="/account/settings" />}>
                                    <SettingsIcon />
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" onClick={handleSignOut} disabled={isLoggingOut}>
                                    <LogOutIcon />
                                    Sign out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <>
                            <LinkButton href="/auth/sign-in" variant="ghost">
                                Sign in
                            </LinkButton>
                            <LinkButton
                                href="/auth/sign-up"
                                className="bg-brand text-brand-foreground hover:bg-brand/90"
                            >
                                Get started
                            </LinkButton>
                        </>
                    )}
                </div>

                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger
                        render={
                            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                                <MenuIcon />
                            </Button>
                        }
                    />
                    <SheetContent side="right" className="flex w-72 flex-col gap-1 p-4">
                        <SheetHeader className="px-0">
                            <SheetTitle>
                                <Logo size="sm" />
                            </SheetTitle>
                        </SheetHeader>

                        {user ? (
                            <>
                                <div className="mb-2 flex items-center gap-3 rounded-lg border border-border p-3">
                                    <Avatar>
                                        {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={displayName} />}
                                        <AvatarFallback>{initials(displayName)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex min-w-0 flex-col">
                                        <Text variant="small" weight="medium">
                                            {displayName}
                                        </Text>
                                        <Text variant="small" tone="muted" className="truncate">
                                            {user.email}
                                        </Text>
                                    </div>
                                </div>

                                {isPlatformAdmin && (
                                    <LinkButton
                                        href="/platform"
                                        variant="ghost"
                                        className="justify-start"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        <LayoutDashboardIcon data-icon="inline-start" />
                                        Console
                                    </LinkButton>
                                )}
                                {canViewDashboard && (
                                    <LinkButton
                                        href="/dashboard"
                                        variant="ghost"
                                        className="justify-start"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        <LayoutDashboardIcon data-icon="inline-start" />
                                        Dashboard
                                    </LinkButton>
                                )}
                                <LinkButton
                                    href="/account"
                                    variant="ghost"
                                    className="justify-start"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <UserIcon data-icon="inline-start" />
                                    Profile
                                </LinkButton>
                                <LinkButton
                                    href="/account/settings"
                                    variant="ghost"
                                    className="justify-start"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <SettingsIcon data-icon="inline-start" />
                                    Settings
                                </LinkButton>

                                <LoadingButton
                                    variant="outline"
                                    className="mt-2 justify-start text-destructive hover:text-destructive"
                                    isLoading={isLoggingOut}
                                    onClick={handleSignOut}
                                >
                                    <LogOutIcon data-icon="inline-start" />
                                    Sign out
                                </LoadingButton>
                            </>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <LinkButton
                                    href="/auth/sign-up"
                                    className="bg-brand text-brand-foreground hover:bg-brand/90"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    Get started
                                </LinkButton>
                                <LinkButton href="/auth/sign-in" variant="outline" onClick={() => setMobileOpen(false)}>
                                    Sign in
                                </LinkButton>
                            </div>
                        )}
                    </SheetContent>
                </Sheet>
            </nav>
        </header>
    );
};
