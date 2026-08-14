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

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "dapi-test/0.1.0",
    ...customHeaders,
    ...testCase.headers,
  };

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
