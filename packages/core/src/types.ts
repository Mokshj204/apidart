export interface OpenAPISpec {
  info: { title: string; version: string };
  paths: Record<string, unknown>;
  components?: { schemas?: Record<string, unknown> };
}

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface TestCase {
  id: string;
  method: HttpMethod;
  path: string;
  params: Record<string, unknown>;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  description: string;
}

export interface ValidationError {
  type: "schema" | "status" | "timing" | "custom";
  message: string;
  path?: string;
}

export interface TestResult {
  id: string;
  testCase: TestCase;
  status: number;
  responseBody: unknown;
  responseTime: number;
  passed: boolean;
  errors: ValidationError[];
  metadata?: Record<string, unknown>;
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  avgTime: number;
  maxTime: number;
  minTime: number;
}
