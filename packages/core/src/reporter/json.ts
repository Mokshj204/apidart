import type { TestRunResult } from "../types";

export function toJsonReport(result: TestRunResult): string {
  return JSON.stringify(result, null, 2);
}
