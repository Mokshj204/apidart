export * from "./types";
export * from "./parser";
export * from "./generator";
export * from "./executor";
export * from "./assertions";
export * from "./reporter";

import type { TestResult } from "./types";

export class Pipeline {
  async run(_specUrl: string): Promise<TestResult[]> {
    throw new Error("not implemented");
  }
}
