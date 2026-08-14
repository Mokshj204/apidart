import type { HttpMethod, Operation, TestCase } from "../types";
import { generateValueForSchema } from "./data-factory";

export function buildTestCase(method: string, path: string, operation: Operation): TestCase {
  const pathParams: Record<string, unknown> = {};
  const queryParams: Record<string, unknown> = {};
  const headers: Record<string, string> = {};

  for (const param of operation.parameters ?? []) {
    const value = generateValueForSchema(param.schema, param.name);
    if (param.in === "path") pathParams[param.name] = value;
    else if (param.in === "query") queryParams[param.name] = value;
    else if (param.in === "header") headers[param.name] = String(value);
  }

  let resolvedPath = path;
  for (const [key, value] of Object.entries(pathParams)) {
    resolvedPath = resolvedPath.replace(`{${key}}`, encodeURIComponent(String(value)));
  }

  let body: Record<string, unknown> | undefined;
  const jsonSchema = operation.requestBody?.content?.["application/json"]?.schema;
  if (jsonSchema) {
    body = generateValueForSchema(jsonSchema) as Record<string, unknown>;
  }

  return {
    id: `${method.toUpperCase()} ${path}`,
    method: method.toUpperCase() as HttpMethod,
    path: resolvedPath,
    templatePath: path,
    operationId: operation.operationId,
    params: queryParams,
    body,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    description: operation.summary || operation.description || `${method.toUpperCase()} ${path}`,
  };
}
