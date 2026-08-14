import { describe, expect, test } from "bun:test";
import { buildTestCase } from "../src/generator/request-builder";
import type { Operation } from "../src/parser/types";

const okResponses = { "200": { description: "ok" } };

describe("buildTestCase", () => {
  test("routes query params into params and header params into headers", () => {
    const operation: Operation = {
      parameters: [
        { name: "limit", in: "query", schema: { type: "integer", minimum: 5, maximum: 5 } },
        { name: "X-Api-Key", in: "header", schema: { type: "string", example: "secret" } },
      ],
      responses: okResponses,
    };

    const testCase = buildTestCase("get", "/widgets", operation);

    expect(testCase.params).toEqual({ limit: 5 });
    expect(testCase.headers).toEqual({ "X-Api-Key": "secret" });
  });

  test("omits headers entirely when there are no header params", () => {
    const testCase = buildTestCase("get", "/widgets", { responses: okResponses });
    expect(testCase.headers).toBeUndefined();
  });

  test("URL-encodes substituted path param values", () => {
    const operation: Operation = {
      parameters: [{ name: "name", in: "path", required: true, schema: { type: "string", example: "a b/c" } }],
      responses: okResponses,
    };

    const testCase = buildTestCase("get", "/widgets/{name}", operation);

    expect(testCase.path).toBe(`/widgets/${encodeURIComponent("a b/c")}`);
    expect(testCase.templatePath).toBe("/widgets/{name}");
  });

  test("substitutes multiple path params independently", () => {
    const operation: Operation = {
      parameters: [
        { name: "a", in: "path", required: true, schema: { type: "string", example: "x" } },
        { name: "b", in: "path", required: true, schema: { type: "string", example: "y" } },
      ],
      responses: okResponses,
    };

    const testCase = buildTestCase("get", "/{a}/{b}", operation);
    expect(testCase.path).toBe("/x/y");
  });

  test("leaves body undefined when there is no request body", () => {
    const testCase = buildTestCase("get", "/ping", { responses: okResponses });
    expect(testCase.body).toBeUndefined();
  });

  test("uses the summary as the description when present", () => {
    const testCase = buildTestCase("get", "/ping", { summary: "Health check", responses: okResponses });
    expect(testCase.description).toBe("Health check");
  });

  test("falls back to description, then to method+path, when summary is absent", () => {
    const withDescription = buildTestCase("get", "/ping", { description: "Pings the server", responses: okResponses });
    expect(withDescription.description).toBe("Pings the server");

    const withNeither = buildTestCase("get", "/ping", { responses: okResponses });
    expect(withNeither.description).toBe("GET /ping");
  });

  test("attaches a request body to a QUERY operation, same as POST", () => {
    const operation: Operation = {
      requestBody: {
        required: true,
        content: { "application/json": { schema: { type: "object", properties: { term: { type: "string" } } } } },
      },
      responses: okResponses,
    };

    const testCase = buildTestCase("query", "/widgets/search", operation);

    expect(testCase.method).toBe("QUERY");
    expect(testCase.id).toBe("QUERY /widgets/search");
    expect(testCase.body).toBeDefined();
    expect(typeof testCase.body!.term).toBe("string");
  });

  test("carries the operationId through unchanged", () => {
    const testCase = buildTestCase("post", "/widgets", { operationId: "createWidget", responses: okResponses });
    expect(testCase.operationId).toBe("createWidget");
  });
});
