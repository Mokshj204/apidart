import { faker } from "@faker-js/faker";

export function generateValueForSchema(schema: any, hint?: string): unknown {
  if (!schema) return null;
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (Array.isArray(schema.enum) && schema.enum.length > 0) return schema.enum[0];

  const type = Array.isArray(schema.type) ? schema.type.find((t: string) => t !== "null") : schema.type;
  const lowerHint = hint?.toLowerCase() ?? "";

  switch (type) {
    case "string":
      if (schema.format === "date-time") return faker.date.recent().toISOString();
      if (schema.format === "date") return faker.date.recent().toISOString().slice(0, 10);
      if (schema.format === "uuid") return faker.string.uuid();
      if (schema.format === "email" || lowerHint.includes("email")) return faker.internet.email();
      if (lowerHint.includes("name")) return faker.person.fullName();
      if (lowerHint.includes("url")) return faker.internet.url();
      if (lowerHint.includes("phone")) return faker.phone.number();
      if (schema.minLength || schema.maxLength) {
        return faker.string.alpha({ length: schema.minLength ?? 5 });
      }
      return faker.lorem.words(2);

    case "integer":
    case "number": {
      const min = schema.minimum ?? 1;
      const max = schema.maximum ?? min + 100;
      return type === "integer" ? faker.number.int({ min, max }) : faker.number.float({ min, max });
    }

    case "boolean":
      return faker.datatype.boolean();

    case "array":
      return [generateValueForSchema(schema.items, hint)];

    case "object": {
      if (!schema.properties) return {};
      const obj: Record<string, unknown> = {};
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        obj[key] = generateValueForSchema(propSchema, key);
      }
      return obj;
    }

    default:
      return null;
  }
}
