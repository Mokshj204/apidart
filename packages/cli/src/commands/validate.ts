import { Command } from "commander";
import { validateSpecDocument } from "@dapi-test/core";

export function createValidateCommand(): Command {
  return new Command("validate")
    .description("Check that an OpenAPI spec is structurally valid — no requests sent")
    .requiredOption("--url <specUrl>", "OpenAPI spec URL or file path")
    .option("--json", "Print the validation result as JSON")
    .action(async (options) => {
      try {
        const result = await validateSpecDocument(options.url);

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else if (result.valid) {
          console.log(`Valid OpenAPI ${result.version} spec: ${result.title ?? options.url}`);
          console.log(`${result.endpointCount} endpoint operation(s) found`);
        } else {
          console.error(`Invalid OpenAPI spec: ${options.url}`);
          for (const error of result.errors) {
            console.error(`  - ${error.path ? `[${error.path}] ` : ""}${error.message}`);
          }
        }

        process.exit(result.valid ? 0 : 1);
      } catch (error) {
        console.error("Error:", error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
