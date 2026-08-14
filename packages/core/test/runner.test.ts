import { describe, expect, test, afterEach } from "bun:test";
import { runTestCases } from "../src/executor/runner";
import { ExecutionContext } from "../src/executor/context";
import type { TestCase } from "../src/types";

const testCase = (id: string, path: string): TestCase => ({
  id,
  method: "GET",
  path,
  templatePath: path,
  params: {},
  description: id,
});

let server: ReturnType<typeof Bun.serve> | undefined;

afterEach(() => {
  server?.stop(true);
  server = undefined;
});

describe("runTestCases", () => {
  test("runs each test case in order and reports progress", async () => {
    server = Bun.serve({
      port: 0,
      fetch: (req) => new Response("ok", { status: new URL(req.url).pathname === "/fail" ? 500 : 200 }),
    });

    const cases = [testCase("GET /a", "/a"), testCase("GET /fail", "/fail"), testCase("GET /b", "/b")];
    const progress: Array<[number, number]> = [];

    const executions = await runTestCases(cases, `http://localhost:${server.port}`, new ExecutionContext(), {
      onProgress: (completed, total) => progress.push([completed, total]),
    });

    expect(executions.map((e) => e.testCase.id)).toEqual(["GET /a", "GET /fail", "GET /b"]);
    expect(executions.map((e) => e.response.status)).toEqual([200, 500, 200]);
    expect(progress).toEqual([
      [1, 3],
      [2, 3],
      [3, 3],
    ]);
  });

  test("forwards custom headers to every request", async () => {
    const receivedAuth: Array<string | null> = [];
    server = Bun.serve({
      port: 0,
      fetch: (req) => {
        receivedAuth.push(req.headers.get("authorization"));
        return new Response("ok");
      },
    });

    await runTestCases([testCase("GET /a", "/a")], `http://localhost:${server.port}`, new ExecutionContext(), {
      headers: { authorization: "Bearer token" },
    });

    expect(receivedAuth).toEqual(["Bearer token"]);
  });

  test("captures a failed fetch as a status-0 execution instead of throwing", async () => {
    const executions = await runTestCases(
      [testCase("GET /unreachable", "/unreachable")],
      "http://127.0.0.1:1",
      new ExecutionContext(),
    );

    expect(executions).toHaveLength(1);
    expect(executions[0]!.response.status).toBe(0);
    expect(executions[0]!.response.timing).toBe(0);
    expect(typeof executions[0]!.response.body).toBe("string");
    expect(executions[0]!.response.body.length).toBeGreaterThan(0);
  });
});
