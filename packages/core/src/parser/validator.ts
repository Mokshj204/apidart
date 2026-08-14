import { openapi } from "@scalar/openapi-parser";
import { fetchSpecText } from "./loader";
import type { OpenAPISpec } from "../types";

export interface SpecValidationError {
  message: string;
  path?: string;
}

export interface SpecValidationResult {
  valid: boolean;
  version?: "2.0" | "3.0" | "3.1";
  specificationType?: string;
  title?: string;
  endpointCount: number;
  errors: SpecValidationError[];
}

/**
 * Checks that a spec is structurally valid OpenAPI/Swagger — no requests sent.
 * Separate from response schema validation in assertions/schema-validator.ts,
 * which checks live API responses against the (already-valid) spec.
 */
export async function validateSpecDocument(urlOrPath: string): Promise<SpecValidationResult> {
  const raw = await fetchSpecText(urlOrPath);
  const loaded = openapi().load(raw);

  const details = await loaded.details();
  const validated = await loaded.upgrade().validate();

  const errors: SpecValidationError[] = (validated.errors ?? []).map((error) => ({
    message: error.message ?? "unknown error",
    path: (error as { path?: string }).path || undefined,
  }));

  let endpointCount = 0;
  let title: string | undefined;

  if (validated.valid) {
    const dereferenced = await validated.dereference().get();
    const spec = (dereferenced as { schema: OpenAPISpec }).schema;
    endpointCount = Object.values(spec.paths ?? {}).reduce(
      (sum, pathItem) => sum + Object.keys(pathItem ?? {}).length,
      0,
    );
    title = spec.info?.title;
  }

  return {
    valid: validated.valid,
    version: details.version,
    specificationType: details.specificationType,
    title,
    endpointCount,
    errors,
  };
}
