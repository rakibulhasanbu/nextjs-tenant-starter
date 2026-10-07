import { NavItem } from "@/features/auth/types";
import { BuildingIcon, ClipboardListIcon, ScrollTextIcon, SettingsIcon } from "lucide-react";

export const platformNavItems: NavItem[] = [
    { title: "Organizations", url: "/platform/tenants", icon: BuildingIcon },
    { title: "Requests", url: "/platform/requests", icon: ClipboardListIcon },
    { title: "Audit log", url: "/platform/audit", icon: ScrollTextIcon },
    { title: "Settings", url: "/platform/settings", icon: SettingsIcon },
];
