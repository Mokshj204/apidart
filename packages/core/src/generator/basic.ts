import type { OpenAPISpec, TestCase } from "../types";
import type { GeneratorStrategy } from "./strategy";
import { buildTestCase } from "./request-builder";

const HTTP_METHODS = ["get", "post", "put", "delete", "patch", "query"] as const;

export const basicStrategy: GeneratorStrategy = {
  name: "basic",
  generate(spec: OpenAPISpec): TestCase[] {
    const testCases: TestCase[] = [];

    for (const [path, pathItem] of Object.entries(spec.paths)) {
      for (const method of HTTP_METHODS) {
        const operation = pathItem[method];
        if (!operation) continue;
        testCases.push(buildTestCase(method, path, operation));
      }
    }

    return testCases;
  },
};
