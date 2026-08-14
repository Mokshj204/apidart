import type { ValidationError } from "../types";

export function validateTiming(timeMs: number, maxMs?: number): ValidationError[] {
  if (maxMs === undefined || timeMs <= maxMs) return [];

  return [
    {
      type: "timing",
      message: `Response took ${timeMs.toFixed(0)}ms, exceeding the ${maxMs}ms limit`,
      expected: maxMs,
      actual: timeMs,
    },
  ];
}
