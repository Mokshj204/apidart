export interface Parameter {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required?: boolean;
  schema?: any;
}

export interface MediaType {
  schema?: any;
}

export interface RequestBody {
  required?: boolean;
  content: Record<string, MediaType>;
}

export interface ResponseObject {
  description: string;
  content?: Record<string, MediaType>;
}

export interface Operation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, ResponseObject>;
}

export type PathItem = Partial<
  Record<"get" | "put" | "post" | "delete" | "options" | "head" | "patch" | "trace" | "query", Operation>
>;

export interface OpenAPISpec {
  openapi: string;
  info: { title: string; version: string; description?: string };
  servers?: Array<{ url: string; description?: string }>;
  paths: Record<string, PathItem>;
  components?: { schemas?: Record<string, unknown>; securitySchemes?: Record<string, unknown> };
}

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "QUERY";

export interface TestCase {
  id: string;
  method: HttpMethod;
  /** Resolved path with path params substituted, ready to append to a base URL. */
  path: string;
  /** Raw OpenAPI path template (e.g. "/pets/{id}"), used to look up the operation in the spec. */
  templatePath: string;
  operationId?: string;
  /** Query params only — path params are already substituted into `path`. */
  params: Record<string, unknown>;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  description: string;
}

export interface ValidationError {
  type: "schema" | "status" | "timing" | "custom";
  message: string;
  path?: string;
  expected?: unknown;
  actual?: unknown;
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

export interface TestRunResult {
  spec: OpenAPISpec;
  results: TestResult[];
  summary: TestSummary;
  timestamp: string;
  durationMs: number;
}

export interface TestConfig {
  baseUrl?: string;
  headers?: Record<string, string>;
  /** Response time SLA in ms; responses slower than this fail with a timing error. */
  timeout?: number;
  skipValidation?: boolean;
  filter?: {
    tags?: string[];
    paths?: string[];
    methods?: string[];
  };
  onProgress?: (completed: number, total: number) => void;
}
