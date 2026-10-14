import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveBranchSummaryEngine } from "./adaptive-branch-summary-engine.js";
import { newAdaptiveBranchSummary } from "./adaptive-branch-summary.js";

test("AdaptiveBranchSummaryEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveBranchSummaryEngine(flags.newRegistry());
  const item = newAdaptiveBranchSummary("code-536", "label-540");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
