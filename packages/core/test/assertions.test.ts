import { describe, expect, test } from "bun:test";
import { validateStatus } from "../src/assertions/status-validator";
import { validateSchema } from "../src/assertions/schema-validator";
import { validateTiming } from "../src/assertions/time-validator";

describe("validateStatus", () => {
  test("passes for a default-accepted status", () => {
    expect(validateStatus(200)).toEqual([]);
    expect(validateStatus(204)).toEqual([]);
  });

  test("fails for a status outside the accepted list", () => {
    const errors = validateStatus(500);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.type).toBe("status");
  });

  test("respects a custom expected list", () => {
    expect(validateStatus(404, [404])).toEqual([]);
    expect(validateStatus(200, [404])).toHaveLength(1);
  });
});

describe("validateSchema", () => {
  const schema = {
    type: "object",
    properties: { name: { type: "string" } },
    required: ["name"],
  };

  test("passes when no schema is given", () => {
    expect(validateSchema("anything", undefined)).toEqual([]);
  });

  test("passes for a body matching the schema", () => {
    expect(validateSchema(JSON.stringify({ name: "widget" }), schema)).toEqual([]);
  });

  test("fails for a body missing a required property", () => {
    const errors = validateSchema(JSON.stringify({}), schema);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.type).toBe("schema");
  });

  test("fails without throwing when the body isn't JSON", () => {
    const errors = validateSchema("<html>not json</html>", schema);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain("not valid JSON");
  });
});

describe("validateTiming", () => {
  test("passes when no limit is set", () => {
    expect(validateTiming(99999)).toEqual([]);
  });

  test("passes when under the limit", () => {
    expect(validateTiming(50, 100)).toEqual([]);
  });

  test("fails when over the limit", () => {
    const errors = validateTiming(150, 100);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.type).toBe("timing");
  });
});
