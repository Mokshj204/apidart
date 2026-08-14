import type { TestCase, TestResult } from "../types";
import type { ExecutionContext } from "./context";

export async function runTestCases(
  _testCases: TestCase[],
  _context: ExecutionContext,
): Promise<TestResult[]> {
  throw new Error("not implemented");
}
