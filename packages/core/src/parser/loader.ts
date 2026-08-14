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

export async function loadSpec(urlOrPath: string): Promise<OpenAPISpec> {
  const raw = await fetchSpecText(urlOrPath);

  let validated: Awaited<ReturnType<ReturnType<ReturnType<typeof openapi>["load"]>["upgrade"]>["validate"]>;
  try {
    validated = await openapi().load(raw).upgrade().validate();
  } catch (error) {
    throw new Error(`Invalid OpenAPI spec: could not parse ${urlOrPath} as JSON or YAML (${error instanceof Error ? error.message : String(error)})`);
  }

  if (!validated.valid) {
    const messages = validated.errors?.map((e) => e.message).join("; ") || "unknown validation error";
    throw new Error(`Invalid OpenAPI spec: ${messages}`);
  }

  const dereferenced = await validated.dereference().get();
  return (dereferenced as { schema: OpenAPISpec }).schema;
}
