import { openapi } from "@scalar/openapi-parser";
import { fetchSpecText } from "./loader";
import type { OpenAPISpec } from "../types";

// PathItem Object keys that are actual operations, per the OpenAPI spec — as
// opposed to sibling metadata like "parameters", "summary", "description", or
// "servers" that share the same object but aren't endpoints.
const HTTP_METHOD_KEYS = ["get", "put", "post", "delete", "options", "head", "patch", "trace", "query"] as const;

export interface SpecValidationError {
  message: string;
  path?: string;
}

export interface SpecValidationResult {
  valid: boolean;
  version?: "2.0" | "3.0" | "3.1" | "3.2";
  specificationType?: string;
  title?: string;
  endpointCount: number;
  errors: SpecValidationError[];
}

// validate() and dereference() are lazy chain builders, not resolved
// promises — each needs its own .get() to materialize. Chaining
// .dereference() straight onto an already-.get()'d validation result would
// silently replace its `errors` with dereference's own (empty, since there's
// nothing to dereference on an invalid doc), so validity/errors are read from
// validate()'s .get() before dereference is ever invoked.
async function loadDetailsAndValidate(raw: string) {
  const loaded = openapi().load(raw);
  const details = await loaded.details();
  const validated = loaded.upgrade().validate();
  const result = await validated.get();
  return { details, validated, result };
}

/**
 * Checks that a spec is structurally valid OpenAPI/Swagger — no requests sent.
 * Separate from response schema validation in assertions/schema-validator.ts,
 * which checks live API responses against the (already-valid) spec.
 */
export async function validateSpecDocument(urlOrPath: string): Promise<SpecValidationResult> {
  const raw = await fetchSpecText(urlOrPath);

  let details: Awaited<ReturnType<typeof loadDetailsAndValidate>>["details"];
  let validated: Awaited<ReturnType<typeof loadDetailsAndValidate>>["validated"];
  let result: Awaited<ReturnType<typeof loadDetailsAndValidate>>["result"];
  try {
    ({ details, validated, result } = await loadDetailsAndValidate(raw));
  } catch (error) {
    return {
      valid: false,
      endpointCount: 0,
      errors: [
        {
          message: `Could not parse ${urlOrPath} as JSON or YAML: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }

  const errors: SpecValidationError[] = (result.errors ?? []).map((error) => ({
    message: error.message ?? "unknown error",
    path: (error as { path?: string }).path || undefined,
  }));

  let endpointCount = 0;
  let title: string | undefined;

  if (result.valid) {
    const dereferenced = await validated.dereference().get();
    const spec = (dereferenced as { schema: OpenAPISpec }).schema;
    endpointCount = Object.values(spec.paths ?? {}).reduce(
      (sum, pathItem) => sum + HTTP_METHOD_KEYS.filter((method) => pathItem?.[method]).length,
      0,
    );
    title = spec.info?.title;
  }

  return {
    valid: result.valid,
    version: details.version,
    specificationType: details.specificationType,
    title,
    endpointCount,
    errors,
  };
}
