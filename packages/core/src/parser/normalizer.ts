import type { OpenAPISpec } from "../types";

/**
 * Picks the base URL to send requests against: explicit override, else the
 * spec's declared server (resolved against the spec's own URL if relative),
 * else the spec URL's origin — since many local backends declare no servers
 * block at all, or a relative one like "/api".
 */
export function resolveBaseUrl(spec: OpenAPISpec, override?: string, specUrl?: string): string {
  if (override) return override;

  const specIsRemote = specUrl !== undefined && /^https?:\/\//i.test(specUrl);
  const serverUrl = spec.servers?.[0]?.url;

  if (serverUrl) {
    if (/^https?:\/\//i.test(serverUrl)) return serverUrl;
    if (specIsRemote) return new URL(serverUrl, specUrl).toString();
  }

  if (specIsRemote) return new URL(specUrl!).origin;

  return "http://localhost";
}
