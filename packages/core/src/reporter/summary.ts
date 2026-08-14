import type { TestResult, TestSummary } from "../types";

export function summarize(results: TestResult[]): TestSummary {
  if (results.length === 0) {
    return { total: 0, passed: 0, failed: 0, avgTime: 0, maxTime: 0, minTime: 0 };
  }

  const times = results.map((r) => r.responseTime);
  const passed = results.filter((r) => r.passed).length;

  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    avgTime: times.reduce((sum, t) => sum + t, 0) / times.length,
    maxTime: Math.max(...times),
    minTime: Math.min(...times),
  };
}
