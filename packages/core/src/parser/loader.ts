import { openapi } from "@scalar/openapi-parser";
import type { OpenAPISpec } from "../types";

export async function fetchSpecText(urlOrPath: string): Promise<string> {
  const isRemote = /^https?:\/\//i.test(urlOrPath);

  try {
    if (isRemote) {
      const response = await fetch(urlOrPath);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      return await response.text();
    }
    return await Bun.file(urlOrPath).text();
  } catch (error) {
    throw new Error(`Failed to load spec from ${urlOrPath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// See the matching comment in validator.ts: validate()/dereference() are lazy
// chain builders that each need their own .get(), and dereference's .get()
// carries its own (empty) errors rather than validate's — so validity/errors
// must be read here, before dereference is invoked.
async function upgradeAndValidate(raw: string) {
  const validated = openapi().load(raw).upgrade().validate();
  const result = await validated.get();
  return { validated, result };
}

export async function loadSpec(urlOrPath: string): Promise<OpenAPISpec> {
  const raw = await fetchSpecText(urlOrPath);

  let validated: Awaited<ReturnType<typeof upgradeAndValidate>>["validated"];
  let result: Awaited<ReturnType<typeof upgradeAndValidate>>["result"];
  try {
    ({ validated, result } = await upgradeAndValidate(raw));
  } catch (error) {
    throw new Error(
      `Invalid OpenAPI spec: could not parse ${urlOrPath} as JSON or YAML (${error instanceof Error ? error.message : String(error)})`,
    );
  }

  if (!result.valid) {
    const messages = result.errors?.map((e) => e.message).join("; ") || "unknown validation error";
    throw new Error(`Invalid OpenAPI spec: ${messages}`);
  }

  const dereferenced = await validated.dereference().get();
  return (dereferenced as { schema: OpenAPISpec }).schema;
}
