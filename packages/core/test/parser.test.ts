import { afterEach, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { fetchSpecText, loadSpec } from "../src/parser/loader";
import { validateSpecDocument } from "../src/parser/validator";
import { resolveBaseUrl } from "../src/parser/normalizer";
import type { OpenAPISpec } from "../src/types";

const fixture = (name: string) => join(import.meta.dir, "fixtures", name);

describe("validateSpecDocument", () => {
  test("accepts a valid OpenAPI 3.0 spec", async () => {
    const result = await validateSpecDocument(fixture("valid-basic.json"));
    expect(result.valid).toBe(true);
    expect(result.version).toBe("3.0");
    expect(result.title).toBe("Fixture API");
    expect(result.endpointCount).toBe(3);
    expect(result.errors).toEqual([]);
  });

  test("accepts a spec with a relative server URL", async () => {
    const result = await validateSpecDocument(fixture("valid-relative-server.json"));
    expect(result.valid).toBe(true);
    expect(result.endpointCount).toBe(1);
  });

  test("accepts and upgrades a Swagger 2.0 spec", async () => {
    const result = await validateSpecDocument(fixture("swagger2-valid.json"));
    expect(result.valid).toBe(true);
    expect(result.version).toBe("2.0");
    expect(result.endpointCount).toBe(1);
  });

  test("accepts an OpenAPI 3.1 spec", async () => {
    const result = await validateSpecDocument(fixture("valid-3.1.json"));
    expect(result.valid).toBe(true);
    expect(result.version).toBe("3.1");
    expect(result.endpointCount).toBe(1);
  });

  test("accepts a spec with an empty paths object and reports zero endpoints", async () => {
    const result = await validateSpecDocument(fixture("valid-empty-paths.json"));
    expect(result.valid).toBe(true);
    expect(result.endpointCount).toBe(0);
  });

  test("counts only operations, not path-level metadata like parameters/summary/description", async () => {
    const result = await validateSpecDocument(fixture("path-level-metadata.json"));
    expect(result.valid).toBe(true);
    expect(result.endpointCount).toBe(2);
  });

  test("accepts an OpenAPI 3.2 spec using the QUERY method", async () => {
    const result = await validateSpecDocument(fixture("valid-query-method.json"));
    expect(result.valid).toBe(true);
    expect(result.version).toBe("3.2");
    expect(result.endpointCount).toBe(1);
  });

  test("rejects a spec missing paths", async () => {
    const result = await validateSpecDocument(fixture("missing-paths.json"));
    expect(result.valid).toBe(false);
    expect(result.endpointCount).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test("rejects a spec missing info", async () => {
    const result = await validateSpecDocument(fixture("missing-info.json"));
    expect(result.valid).toBe(false);
  });

  test("rejects a document that isn't OpenAPI at all", async () => {
    const result = await validateSpecDocument(fixture("not-openapi.json"));
    expect(result.valid).toBe(false);
  });

  test("rejects malformed JSON without throwing", async () => {
    const result = await validateSpecDocument(fixture("malformed-syntax.json"));
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.message).toContain("Could not parse");
  });
});

describe("loadSpec", () => {
  test("loads and dereferences a valid spec", async () => {
    const spec = await loadSpec(fixture("valid-basic.json"));
    expect(Object.keys(spec.paths)).toEqual(["/ping", "/widgets", "/widgets/{id}"]);
    expect(spec.paths["/widgets"]?.post?.requestBody?.content["application/json"]?.schema.properties.name.type).toBe(
      "string",
    );
  });

  test("throws a clear error for an invalid spec", async () => {
    await expect(loadSpec(fixture("missing-paths.json"))).rejects.toThrow(/Invalid OpenAPI spec/);
  });

  test("throws a clear error for malformed JSON", async () => {
    await expect(loadSpec(fixture("malformed-syntax.json"))).rejects.toThrow(/could not parse/i);
  });
});

describe("fetchSpecText (remote)", () => {
  let server: ReturnType<typeof Bun.serve> | undefined;

  afterEach(() => {
    server?.stop(true);
    server = undefined;
  });

  test("fetches spec text over http(s) instead of reading it as a local path", async () => {
    server = Bun.serve({
      port: 0,
      fetch: () => new Response('{"openapi":"3.0.0"}', { headers: { "content-type": "application/json" } }),
    });

    const text = await fetchSpecText(`http://localhost:${server.port}/openapi.json`);
    expect(text).toBe('{"openapi":"3.0.0"}');
  });

  test("throws a clear error when the remote server responds with a non-2xx status", async () => {
    server = Bun.serve({
      port: 0,
      fetch: () => new Response("not found", { status: 404, statusText: "Not Found" }),
    });

    await expect(fetchSpecText(`http://localhost:${server.port}/missing.json`)).rejects.toThrow(/404/);
  });
});

describe("resolveBaseUrl", () => {
  const spec = (servers?: Array<{ url: string }>): OpenAPISpec => ({
    openapi: "3.0.0",
    info: { title: "x", version: "1.0.0" },
    paths: {},
    servers,
  });

  test("prefers an explicit override", () => {
    expect(resolveBaseUrl(spec([{ url: "https://ignored.example" }]), "https://override.example")).toBe(
      "https://override.example",
    );
  });

  test("uses an absolute server URL as-is", () => {
    expect(resolveBaseUrl(spec([{ url: "https://api.example.com" }]))).toBe("https://api.example.com");
  });

  test("resolves a relative server URL against the spec URL's origin", () => {
    expect(resolveBaseUrl(spec([{ url: "/api/v1" }]), undefined, "https://host.example/openapi.json")).toBe(
      "https://host.example/api/v1",
    );
  });

  test("falls back to the spec URL's origin when there are no servers", () => {
    expect(resolveBaseUrl(spec(undefined), undefined, "https://host.example/openapi.json")).toBe(
      "https://host.example",
    );
  });

  test("falls back to localhost when nothing else is available", () => {
    expect(resolveBaseUrl(spec(undefined))).toBe("http://localhost");
  });
});
