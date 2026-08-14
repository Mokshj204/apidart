#!/usr/bin/env bun
import { Command } from "commander";

const program = new Command();

program.name("dapi-test").description("Generate and run tests from an OpenAPI spec").version("0.1.0");

program
  .command("run")
  .description("Generate and execute tests against a running API")
  .requiredOption("--url <specUrl>", "OpenAPI spec URL")
  .action(async () => {
    throw new Error("not implemented");
  });

program
  .command("list")
  .description("List endpoints discovered in an OpenAPI spec")
  .requiredOption("--url <specUrl>", "OpenAPI spec URL")
  .action(async () => {
    throw new Error("not implemented");
  });

program
  .command("validate")
  .description("Validate an OpenAPI spec")
  .requiredOption("--url <specUrl>", "OpenAPI spec URL")
  .action(async () => {
    throw new Error("not implemented");
  });

program
  .command("ui")
  .description("Start the embedded web UI")
  .action(async () => {
    throw new Error("not implemented");
  });

program.parse();
