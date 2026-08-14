import type { TestCase } from "../types";
import { send, type HttpResponse } from "./http-client";
import type { ExecutionContext } from "./context";

export interface Execution {
  testCase: TestCase;
  response: HttpResponse;
}

export async function runTestCases(
  testCases: TestCase[],
  baseUrl: string,
  _context: ExecutionContext,
  options?: {
    headers?: Record<string, string>;
    onProgress?: (completed: number, total: number) => void;
  },
): Promise<Execution[]> {
  const executions: Execution[] = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i]!;
    try {
      const response = await send(testCase, baseUrl, options?.headers);
      executions.push({ testCase, response });
    } catch (error) {
      executions.push({
        testCase,
        response: {
          status: 0,
          headers: {},
          body: error instanceof Error ? error.message : String(error),
          timing: 0,
        },
      });
    }

    options?.onProgress?.(i + 1, testCases.length);
  }

  return executions;
}
