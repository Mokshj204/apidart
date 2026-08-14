import type { OpenAPISpec, TestCase } from "../types";

export interface GeneratorStrategy {
  name: string;
  generate(spec: OpenAPISpec): TestCase[];
}
