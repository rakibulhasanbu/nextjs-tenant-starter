import { HeroActions } from "@/features/auth/components/hero-actions";
import { HeroCodePanel } from "@/features/auth/components/hero-code-panel";
import { KeyRoundIcon, ShieldCheckIcon, UsersIcon, ZapIcon } from "lucide-react";

import { Text } from "@/components/ui/text";

const features = [
    {
        icon: KeyRoundIcon,
        title: "OTP-first auth",
        description: "Email and phone verification with OTP codes, sign-up, sign-in, and password reset baked in.",
    },
    {
        icon: ShieldCheckIcon,
        title: "Two-factor security",
        description: "Optional 2FA with recovery codes, plus session management users can review and revoke.",
    },
    {
        icon: UsersIcon,
        title: "Role-based access",
        description:
            "Every organization gets its own subdomain, roles and members, with a dashboard that adapts to who's signed in.",
    },
    {
        icon: ZapIcon,
        title: "Ready to extend",
        description: "Typed forms, a data table, and a component library so you can ship features on day one.",
    },
];

export default function Home() {
    return (
        <main className="flex flex-1 flex-col">
            <section className="relative overflow-hidden">
                <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden="true" />
                <div
                    className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[32rem] w-[64rem] -translate-x-1/2 rounded-full bg-brand/20 blur-3xl"
                    aria-hidden="true"
                />

                <div className="layout relative flex min-h-[calc(100dvh-4rem)] items-center py-16 sm:py-20">
                    <div className="grid w-full min-w-0 items-center gap-12 md:grid-cols-2 md:gap-16">
                        <div className="flex min-w-0 flex-col items-start gap-6">
                            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
                                <span className="size-1.5 rounded-full bg-success" />
                                Open-source Next.js starter
                            </span>

                            <Text variant="h1" render={<h1 />} className="text-left">
                                Skip the auth boilerplate.
                            </Text>
                            <Text variant="lead" tone="muted" className="max-w-md text-left">
                                Email and OTP verification, role-based access, and session management, wired up and
                                ready to build on.
                            </Text>

                            <HeroActions />
                        </div>

                        <div className="flex min-w-0 justify-center md:justify-end">
                            <HeroCodePanel />
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-t border-border bg-card/30">
                <div className="layout py-16 sm:py-20">
                    <div className="mx-auto max-w-2xl text-center">
                        <Text variant="h2" render={<h2 />}>
                            Everything auth, done once
                        </Text>
                        <Text variant="lead" tone="muted" className="mt-3">
                            A production-shaped foundation so you spend time on your product, not on password resets.
                        </Text>
                    </div>

                    <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {features.map(({ icon: Icon, title, description }) => (
                            <div
                                key={title}
                                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-card transition-colors hover:border-brand/40"
                            >
                                <div className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                                    <Icon className="size-5" />
                                </div>
                                <Text variant="large" className="text-base">
                                    {title}
                                </Text>
                                <Text variant="small" tone="muted" className="leading-relaxed font-normal">
                                    {description}
                                </Text>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <footer className="border-t border-border">
                <div className="layout flex flex-col items-center gap-2 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
                    <Text variant="small" tone="muted" weight="normal">
                        Built with Next.js, Tailwind, and shadcn.
                    </Text>
                    <Text variant="small" tone="muted" weight="normal">
                        &copy; {new Date().getFullYear()} Nextbase. All rights reserved.
                    </Text>
                </div>
            </footer>
        </main>
    );
}
