import { config } from "@/config";

export type HostKind = "apex" | "tenant" | "platform";

export interface ParsedHost {
    kind: HostKind;
    /** Present when `kind` is `tenant`. */
    slug?: string;
}

/** Labels the backend never serves as a tenant (mirrors its `reserved-slugs.constant.ts`) — they are the apex. */
const RESERVED_LABELS = new Set([
    "www",
    "api",
    "app",
    "apps",
    "auth",
    "login",
    "signin",
    "signup",
    "register",
    "account",
    "accounts",
    "billing",
    "dashboard",
    "console",
    "static",
    "assets",
    "cdn",
    "media",
    "files",
    "mail",
    "email",
    "smtp",
    "ftp",
    "docs",
    "blog",
    "help",
    "support",
    "status",
    "staging",
    "dev",
    "test",
    "demo",
    "root",
    "system",
    "platform",
    "internal",
    "security",
    "webhooks",
    "ns1",
    "ns2",
]);

const stripPort = (rawHost: string) => rawHost.split(":")[0]!.trim().toLowerCase().replace(/\.$/, "");

/** Classifies a request host against the root domain, the same way the backend does. */
export const parseHost = (rawHost?: string | null): ParsedHost => {
    const host = stripPort(rawHost ?? "");
    const suffix = `.${config.rootDomain}`;

    if (!host || host === config.rootDomain || !host.endsWith(suffix)) return { kind: "apex" };

    const label = host.slice(0, -suffix.length);

    if (label === config.platformSubdomain) return { kind: "platform" };
    if (label.includes(".") || RESERVED_LABELS.has(label)) return { kind: "apex" };

    return { kind: "tenant", slug: label };
};

/** Where the apex site lives, given any host of this deployment (same scheme/port as the current page). */
export const apexUrl = (protocol: string, rawHost: string, path = "/") => {
    const port = rawHost.includes(":") ? `:${rawHost.split(":")[1]}` : "";
    return `${protocol}//${config.rootDomain}${port}${path}`;
};
