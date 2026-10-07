import { API_VERSION, config } from "@/config";

import { parseHost } from "@/lib/host";

/**
 * The API decides the tenant from the *request host*, and platform sessions are
 * only valid on the platform host. So a page on `acme.<root>` must call the API
 * as `acme.<root>` too: keep the API origin's scheme and port, borrow the page's
 * hostname. The apex (and any foreign host) talks to the configured origin as-is.
 */
export const getApiBaseUrl = (pageHost?: string | null) => {
    const server = new URL(config.serverOrigin);
    const { kind } = parseHost(pageHost);
    const hostname = kind === "apex" || !pageHost ? server.hostname : pageHost.split(":")[0]!.toLowerCase();
    const port = server.port ? `:${server.port}` : "";

    return `${server.protocol}//${hostname}${port}/api/${API_VERSION}`;
};

/** Browser-side shortcut: the base URL for the page the user is on. */
export const getClientApiBaseUrl = () =>
    getApiBaseUrl(typeof window !== "undefined" ? window.location.host : undefined);
