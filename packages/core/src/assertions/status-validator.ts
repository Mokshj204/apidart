import type { ValidationError } from "../types";

const DEFAULT_EXPECTED_STATUSES = [200, 201, 202, 204];

export function validateStatus(actualStatus: number, expectedStatuses: number[] = DEFAULT_EXPECTED_STATUSES): ValidationError[] {
  if (expectedStatuses.includes(actualStatus)) return [];

  return [
    {
      type: "status",
      message: `Expected status ${expectedStatuses.join(" or ")}, got ${actualStatus}`,
      expected: expectedStatuses,
      actual: actualStatus,
    },
  ];
}
