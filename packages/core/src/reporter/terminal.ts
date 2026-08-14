import type { TestRunResult } from "../types";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
};

export function printTerminalReport(result: TestRunResult): void {
  const { summary } = result;

  console.log(`\n${colors.blue}=== Test Results ===${colors.reset}`);
  console.log(
    `${colors.green}Passed${colors.reset}: ${summary.passed}  ${colors.red}Failed${colors.reset}: ${summary.failed}  Total: ${summary.total}`,
  );
  console.log(`Avg: ${summary.avgTime.toFixed(0)}ms  Max: ${summary.maxTime.toFixed(0)}ms  Min: ${summary.minTime.toFixed(0)}ms`);
  console.log(`Completed in ${result.durationMs.toFixed(0)}ms\n`);

  if (summary.failed > 0) {
    console.log(`${colors.red}--- Failed Tests ---${colors.reset}`);
    for (const res of result.results) {
      if (res.passed) continue;
      console.log(`  ${colors.red}x${colors.reset} ${res.testCase.id} (${res.status})`);
      for (const error of res.errors) {
        console.log(`    ${colors.gray}${error.message}${colors.reset}`);
      }
    }
    console.log();
  }

  console.log(`${colors.blue}--- All Tests ---${colors.reset}`);
  for (const res of result.results) {
    const icon = res.passed ? `${colors.green}v` : `${colors.red}x`;
    console.log(
      `${icon}${colors.reset} ${res.testCase.id.padEnd(40)} ${String(res.status).padEnd(4)} ${res.responseTime.toFixed(0)}ms`,
    );
  }
}
