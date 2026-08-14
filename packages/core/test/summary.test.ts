import { describe, expect, test } from "bun:test";
import { summarize } from "../src/reporter/summary";
import type { TestCase, TestResult } from "../src/types";

const testCase: TestCase = {
  id: "GET /ping",
  method: "GET",
  path: "/ping",
  templatePath: "/ping",
  params: {},
  description: "GET /ping",
};

const result = (overrides: Partial<TestResult>): TestResult => ({
  id: testCase.id,
  testCase,
  status: 200,
  responseBody: null,
  responseTime: 0,
  passed: true,
  errors: [],
  ...overrides,
});

describe("summarize", () => {
  test("returns all zeros for an empty result set", () => {
    expect(summarize([])).toEqual({ total: 0, passed: 0, failed: 0, avgTime: 0, maxTime: 0, minTime: 0 });
  });

  test("counts a single passing result", () => {
    const summary = summarize([result({ passed: true, responseTime: 42 })]);
    expect(summary).toEqual({ total: 1, passed: 1, failed: 0, avgTime: 42, maxTime: 42, minTime: 42 });
  });

  test("splits passed and failed counts correctly", () => {
    const summary = summarize([
      result({ passed: true, responseTime: 10 }),
      result({ passed: false, responseTime: 20 }),
      result({ passed: true, responseTime: 30 }),
    ]);
    expect(summary.total).toBe(3);
    expect(summary.passed).toBe(2);
    expect(summary.failed).toBe(1);
  });

  test("computes avg/max/min across response times", () => {
    const summary = summarize([
      result({ responseTime: 10 }),
      result({ responseTime: 50 }),
      result({ responseTime: 30 }),
    ]);
    expect(summary.avgTime).toBe(30);
    expect(summary.maxTime).toBe(50);
    expect(summary.minTime).toBe(10);
  });
});
