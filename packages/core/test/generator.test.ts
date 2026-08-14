import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { loadSpec } from "../src/parser/loader";
import { basicStrategy } from "../src/generator/basic";

const fixture = (name: string) => join(import.meta.dir, "fixtures", name);

describe("basicStrategy.generate", () => {
  test("builds one test case per operation", async () => {
    const spec = await loadSpec(fixture("valid-basic.json"));
    const testCases = basicStrategy.generate(spec);

    expect(testCases).toHaveLength(3);
    expect(testCases.map((tc) => tc.id).sort()).toEqual(
      ["GET /ping", "GET /widgets/{id}", "POST /widgets"].sort(),
    );
  });

  test("substitutes path params and keeps the template path for lookups", () => {
    const testCase = basicStrategy
      .generate({
        openapi: "3.0.0",
        info: { title: "x", version: "1.0.0" },
        paths: {
          "/widgets/{id}": {
            get: {
              parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
              responses: { "200": { description: "ok" } },
            },
          },
        },
      })
      .at(0)!;

    expect(testCase.templatePath).toBe("/widgets/{id}");
    expect(testCase.path).not.toContain("{id}");
    expect(testCase.params).toEqual({});
  });

  test("generates a request body for operations that require one", async () => {
    const spec = await loadSpec(fixture("valid-basic.json"));
    const testCases = basicStrategy.generate(spec);
    const create = testCases.find((tc) => tc.id === "POST /widgets")!;

    expect(create.body).toBeDefined();
    expect(typeof create.body!.name).toBe("string");
    expect(typeof create.body!.quantity).toBe("number");
  });

  test("builds a QUERY test case, including its request body, for an OpenAPI 3.2 query operation", async () => {
    const spec = await loadSpec(fixture("valid-query-method.json"));
    const testCases = basicStrategy.generate(spec);

    expect(testCases).toHaveLength(1);
    const search = testCases[0]!;
    expect(search.id).toBe("QUERY /widgets/search");
    expect(search.method).toBe("QUERY");
    expect(search.body).toBeDefined();
    expect(typeof search.body!.term).toBe("string");
  });

  test("returns no test cases for a spec with no paths", () => {
    expect(
      basicStrategy.generate({ openapi: "3.0.0", info: { title: "x", version: "1.0.0" }, paths: {} }),
    ).toEqual([]);
  });
});
