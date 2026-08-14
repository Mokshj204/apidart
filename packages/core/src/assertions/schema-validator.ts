import Ajv from "ajv";
import type { ValidationError } from "../types";

// validateSchema: false — OpenAPI schemas routinely carry non-conformant
// example/examples values that would otherwise fail ajv's meta-schema check
// before it ever gets to validating a response.
const ajv = new Ajv({ strict: false, allErrors: true, validateSchema: false, logger: false });

export function validateSchema(responseBody: string, schema: unknown): ValidationError[] {
  if (!schema) return [];
  if (!responseBody) return [];

  let data: unknown;
  try {
    data = JSON.parse(responseBody);
  } catch (error) {
    return [
      {
        type: "schema",
        message: `Response body is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
      },
    ];
  }

  const validate = ajv.compile(schema as object);
  const valid = validate(data);
  if (valid || !validate.errors) return [];

  return validate.errors.map((error) => ({
    type: "schema",
    message: `Schema validation failed: ${error.message ?? "unknown error"}`,
    path: error.instancePath,
    expected: error.params,
    actual: error.data,
  }));
}
