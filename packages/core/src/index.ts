export * from "./types";
export * from "./parser";
export * from "./generator";
export * from "./executor";
export * from "./assertions";
export * from "./reporter";

import { loadSpec } from "./parser/loader";
import { resolveBaseUrl } from "./parser/normalizer";
import { basicStrategy } from "./generator/basic";
import { runTestCases } from "./executor/runner";
import { ExecutionContext } from "./executor/context";
import { validateStatus } from "./assertions/status-validator";
import { validateSchema } from "./assertions/schema-validator";
import { validateTiming } from "./assertions/time-validator";
import { summarize } from "./reporter/summary";
import type { OpenAPISpec, TestCase, TestConfig, TestResult, TestRunResult } from "./types";

function findSuccessResponseSchema(spec: OpenAPISpec, testCase: TestCase): unknown {
  const operation = spec.paths[testCase.templatePath]?.[testCase.method.toLowerCase() as "get"];
  const responses = operation?.responses ?? {};
  const successCode = Object.keys(responses).find((code) => code.startsWith("2"));
  return successCode ? responses[successCode]?.content?.["application/json"]?.schema : undefined;
}

function parseJsonSafe(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

export async function runTestPipeline(specUrl: string, config: TestConfig = {}): Promise<TestRunResult> {
  const start = performance.now();

  const spec = await loadSpec(specUrl);
  const baseUrl = resolveBaseUrl(spec, config.baseUrl, specUrl);

  let testCases = basicStrategy.generate(spec);
  if (config.filter?.methods) {
    testCases = testCases.filter((tc) => config.filter!.methods!.includes(tc.method));
  }
  if (config.filter?.paths) {
    testCases = testCases.filter((tc) => config.filter!.paths!.some((p) => tc.path.includes(p)));
  }

  const context = new ExecutionContext();
  const executions = await runTestCases(testCases, baseUrl, context, {
    headers: config.headers,
    onProgress: config.onProgress,
  });

  const results: TestResult[] = executions.map(({ testCase, response }) => {
    const errors = [
      ...validateStatus(response.status),
      ...(config.skipValidation ? [] : validateSchema(response.body, findSuccessResponseSchema(spec, testCase))),
      ...validateTiming(response.timing, config.timeout),
    ];

    return {
      id: testCase.id,
      testCase,
      status: response.status,
      responseBody: parseJsonSafe(response.body),
      responseTime: response.timing,
      passed: errors.length === 0 && response.status > 0,
      errors,
      metadata: { headers: response.headers },
    };
  });

  return {
    spec,
    results,
    summary: summarize(results),
    timestamp: new Date().toISOString(),
    durationMs: performance.now() - start,
  };
}

export class Pipeline {
  async run(specUrl: string, config?: TestConfig): Promise<TestRunResult> {
    return runTestPipeline(specUrl, config);
  }
}
