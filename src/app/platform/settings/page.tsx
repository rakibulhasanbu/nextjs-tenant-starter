import type { Metadata } from "next";

import { PlatformSettingsCard } from "@/features/platform/components/platform-settings-card";

import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Settings" };

export default function PlatformSettingsPage() {
    return (
        <>
            <PageHeader title="Settings" description="Platform-wide onboarding rules." />
            <PlatformSettingsCard />
        </>
    );
}
