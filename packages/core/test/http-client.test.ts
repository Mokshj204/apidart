import { describe, expect, test, afterEach } from "bun:test";
import { send } from "../src/executor/http-client";
import type { TestCase } from "../src/types";

const baseCase: TestCase = {
  id: "GET /echo",
  method: "GET",
  path: "/echo",
  templatePath: "/echo",
  params: {},
  description: "GET /echo",
};

let server: ReturnType<typeof Bun.serve> | undefined;

afterEach(() => {
  server?.stop(true);
  server = undefined;
});

describe("send", () => {
  test("issues the request against baseUrl + path and returns status/body/timing", async () => {
    server = Bun.serve({
      port: 0,
      fetch: () => new Response(JSON.stringify({ ok: true }), { status: 201, headers: { "content-type": "application/json" } }),
    });

    const response = await send(baseCase, `http://localhost:${server.port}`);

    expect(response.status).toBe(201);
    expect(response.body).toBe(JSON.stringify({ ok: true }));
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.timing).toBeGreaterThanOrEqual(0);
  });

  test("trims a trailing slash on baseUrl before appending the path", async () => {
    let receivedPath = "";
    server = Bun.serve({
      port: 0,
      fetch: (req) => {
        receivedPath = new URL(req.url).pathname;
        return new Response("ok");
      },
    });

    await send(baseCase, `http://localhost:${server.port}/`);
    expect(receivedPath).toBe("/echo");
  });

  test("appends query params from the test case", async () => {
    let receivedQuery = "";
    server = Bun.serve({
      port: 0,
      fetch: (req) => {
        receivedQuery = new URL(req.url).search;
        return new Response("ok");
      },
    });

    await send({ ...baseCase, params: { limit: 5, q: "widgets" } }, `http://localhost:${server.port}`);
    const params = new URLSearchParams(receivedQuery);
    expect(params.get("limit")).toBe("5");
    expect(params.get("q")).toBe("widgets");
  });

  test("serializes the test case body as JSON", async () => {
    let receivedBody = "";
    server = Bun.serve({
      port: 0,
      fetch: async (req) => {
        receivedBody = await req.text();
        return new Response("ok");
      },
    });

    await send(
      { ...baseCase, method: "POST", body: { name: "widget" } },
      `http://localhost:${server.port}`,
    );
    expect(receivedBody).toBe(JSON.stringify({ name: "widget" }));
  });

  test("issues an actual QUERY request with a body, since fetch doesn't special-case it", async () => {
    let receivedMethod = "";
    let receivedBody = "";
    server = Bun.serve({
      port: 0,
      fetch: async (req) => {
        receivedMethod = req.method;
        receivedBody = await req.text();
        return new Response("ok");
      },
    });

    await send(
      { ...baseCase, method: "QUERY", body: { term: "widgets" } },
      `http://localhost:${server.port}`,
    );

    expect(receivedMethod).toBe("QUERY");
    expect(receivedBody).toBe(JSON.stringify({ term: "widgets" }));
  });

  test("layers headers: defaults, then customHeaders, then testCase.headers win", async () => {
    let receivedHeaders: Headers | undefined;
    server = Bun.serve({
      port: 0,
      fetch: (req) => {
        receivedHeaders = req.headers;
        return new Response("ok");
      },
    });

    await send(
      { ...baseCase, headers: { "x-foo": "from-testcase" } },
      `http://localhost:${server.port}`,
      { "x-foo": "from-custom", "content-type": "text/plain" },
    );

    expect(receivedHeaders?.get("x-foo")).toBe("from-testcase");
    expect(receivedHeaders?.get("content-type")).toBe("text/plain");
    expect(receivedHeaders?.get("user-agent")).toBe("dapi-test/0.1.0");
  });
});
