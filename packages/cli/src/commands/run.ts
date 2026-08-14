import { Command } from "commander";
import { runTestPipeline, printTerminalReport, toHtmlReport, toJsonReport } from "@dapi-test/core";
import type { TestConfig } from "@dapi-test/core";

export function createRunCommand(): Command {
  return new Command("run")
    .description("Generate and execute tests against a running API")
    .requiredOption("--url <specUrl>", "OpenAPI spec URL or file path")
    .option("-b, --base-url <url>", "Override the base URL requests are sent to")
    .option("-c, --config <file>", "Path to a JSON config file (TestConfig shape)")
    .option("-o, --output <file>", "Write a standalone HTML report to this file")
    .option("--json", "Print results as JSON instead of the terminal report")
    .option("--no-validation", "Skip response schema validation")
    .option("--timeout <ms>", "Fail tests whose response time exceeds this many milliseconds", Number)
    .action(async (options) => {
      const config: TestConfig = {
        baseUrl: options.baseUrl,
        skipValidation: !options.validation,
        timeout: options.timeout,
      };

      if (options.config) {
        const fileConfig = JSON.parse(await Bun.file(options.config).text());
        Object.assign(config, fileConfig);
      }

      if (!options.json) {
        config.onProgress = (completed: number, total: number) => {
          process.stdout.write(`\rRunning tests: ${completed}/${total}`);
        };
      }

      try {
        const result = await runTestPipeline(options.url, config);
        if (!options.json) process.stdout.write("\n");

        if (options.json) {
          console.log(toJsonReport(result));
        } else {
          printTerminalReport(result);
        }

        if (options.output) {
          await Bun.write(options.output, toHtmlReport(result));
          if (!options.json) console.log(`\nReport saved to ${options.output}`);
        }

        process.exit(result.summary.failed === 0 ? 0 : 1);
      } catch (error) {
        console.error("Error:", error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
