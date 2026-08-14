import type { OpenAPISpec, TestCase } from "../types";
import type { GeneratorStrategy } from "./strategy";

export const basicStrategy: GeneratorStrategy = {
  name: "basic",
  generate(_spec: OpenAPISpec): TestCase[] {
    throw new Error("not implemented");
  },
};
