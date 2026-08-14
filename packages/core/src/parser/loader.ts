import { openapi } from "@scalar/openapi-parser";
import type { OpenAPISpec } from "../types";

export async function loadSpec(urlOrPath: string): Promise<OpenAPISpec> {
  const isRemote = /^https?:\/\//i.test(urlOrPath);

  let raw: string;
  try {
    if (isRemote) {
      const response = await fetch(urlOrPath);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      raw = await response.text();
    } else {
      raw = await Bun.file(urlOrPath).text();
    }
  } catch (error) {
    throw new Error(`Failed to load spec from ${urlOrPath}: ${error instanceof Error ? error.message : String(error)}`);
  }

  const validated = await openapi().load(raw).upgrade().validate();
  if (!validated.valid) {
    const messages = validated.errors?.map((e) => e.message).join("; ") || "unknown validation error";
    throw new Error(`Invalid OpenAPI spec: ${messages}`);
  }

  const dereferenced = await validated.dereference().get();
  return (dereferenced as { schema: OpenAPISpec }).schema;
}
