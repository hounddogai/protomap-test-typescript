import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBranchEstimateEngine } from "./branch-estimate-engine.js";
import { newBranchEstimate } from "./branch-estimate.js";

test("BranchEstimateEngine keeps results within bounds", () => {
  const engine = defaultBranchEstimateEngine(flags.newRegistry());
  const item = newBranchEstimate("code-999", "title-208");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
