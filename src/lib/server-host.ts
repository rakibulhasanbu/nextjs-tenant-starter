import "server-only";

import { headers } from "next/headers";

import { getApiBaseUrl } from "@/lib/api-base";
import { parseHost } from "@/lib/host";

/** The host the browser actually used (behind a proxy, the forwarded one). */
export const getRequestHost = async () => {
    const h = await headers();
    return h.get("x-forwarded-host") ?? h.get("host") ?? "";
};

export const getServerApiBase = async () => getApiBaseUrl(await getRequestHost());

export const getRequestHostKind = async () => parseHost(await getRequestHost()).kind;

export const getRequestProtocol = async () => {
    const h = await headers();
    return h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
};
