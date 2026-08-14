import { describe, expect, test } from "bun:test";
import { generateValueForSchema } from "../src/generator/data-factory";

describe("generateValueForSchema", () => {
  test("returns null when no schema is given", () => {
    expect(generateValueForSchema(undefined)).toBeNull();
  });

  test("prefers an explicit example over generation", () => {
    expect(generateValueForSchema({ type: "string", example: "fixed" })).toBe("fixed");
  });

  test("falls back to default when there is no example", () => {
    expect(generateValueForSchema({ type: "integer", default: 7 })).toBe(7);
  });

  test("picks the first enum value", () => {
    expect(generateValueForSchema({ type: "string", enum: ["b", "a"] })).toBe("b");
  });

  test("generates an ISO date-time string for format date-time", () => {
    const value = generateValueForSchema({ type: "string", format: "date-time" }) as string;
    expect(new Date(value).toISOString()).toBe(value);
  });

  test("generates a YYYY-MM-DD string for format date", () => {
    const value = generateValueForSchema({ type: "string", format: "date" }) as string;
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("generates a UUID for format uuid", () => {
    const value = generateValueForSchema({ type: "string", format: "uuid" }) as string;
    expect(value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  test("generates an email for format email", () => {
    const value = generateValueForSchema({ type: "string", format: "email" }) as string;
    expect(value).toContain("@");
  });

  test("generates an email when the property name hints at it", () => {
    const value = generateValueForSchema({ type: "string" }, "contactEmail") as string;
    expect(value).toContain("@");
  });

  test("respects minLength when generating a plain string", () => {
    const value = generateValueForSchema({ type: "string", minLength: 12 }) as string;
    expect(value).toHaveLength(12);
  });

  test("generates a fallback string with no format or hints", () => {
    expect(typeof generateValueForSchema({ type: "string" })).toBe("string");
  });

  test("respects minimum/maximum for integers", () => {
    const value = generateValueForSchema({ type: "integer", minimum: 5, maximum: 5 }) as number;
    expect(value).toBe(5);
    expect(Number.isInteger(value)).toBe(true);
  });

  test("generates a number within the default range when unbounded", () => {
    const value = generateValueForSchema({ type: "number" }) as number;
    expect(value).toBeGreaterThanOrEqual(1);
    expect(value).toBeLessThanOrEqual(101);
  });

  test("generates a boolean", () => {
    expect(typeof generateValueForSchema({ type: "boolean" })).toBe("boolean");
  });

  test("generates a single-item array using the items schema", () => {
    const value = generateValueForSchema({ type: "array", items: { type: "integer", minimum: 3, maximum: 3 } });
    expect(value).toEqual([3]);
  });

  test("recursively builds an object from its properties", () => {
    const value = generateValueForSchema({
      type: "object",
      properties: {
        id: { type: "integer", minimum: 1, maximum: 1 },
        active: { type: "boolean", example: true },
      },
    });
    expect(value).toEqual({ id: 1, active: true });
  });

  test("returns an empty object when a schema has no properties", () => {
    expect(generateValueForSchema({ type: "object" })).toEqual({});
  });

  test("returns null for an unrecognized type", () => {
    expect(generateValueForSchema({ type: "null" })).toBeNull();
  });

  test("unwraps a nullable type array to the non-null branch", () => {
    const value = generateValueForSchema({ type: ["string", "null"], example: undefined, enum: undefined }) as string;
    expect(typeof value).toBe("string");
  });
});
