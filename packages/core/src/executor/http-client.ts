import type { TestCase } from "../types";

export interface HttpResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
  timing: number;
}

export async function send(
  testCase: TestCase,
  baseUrl: string,
  customHeaders?: Record<string, string>,
): Promise<HttpResponse> {
  const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const suffix = testCase.path.startsWith("/") ? testCase.path : `/${testCase.path}`;
  const url = new URL(base + suffix);
  for (const [key, value] of Object.entries(testCase.params)) {
    url.searchParams.set(key, String(value));
  }

  // Built via Headers.set (not object spread) so that header names differing
  // only in case — e.g. a caller-supplied "content-type" vs. the "Content-Type"
  // default — override each other instead of both being sent.
  const headers = new Headers({ "Content-Type": "application/json", "User-Agent": "dapi-test/0.1.0" });
  for (const [key, value] of Object.entries(customHeaders ?? {})) headers.set(key, value);
  for (const [key, value] of Object.entries(testCase.headers ?? {})) headers.set(key, value);

  const start = performance.now();
  const response = await fetch(url.toString(), {
    method: testCase.method,
    headers,
    body: testCase.body !== undefined ? JSON.stringify(testCase.body) : undefined,
  });
  const body = await response.text();
  const timing = performance.now() - start;

  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  return { status: response.status, headers: responseHeaders, body, timing };
}
