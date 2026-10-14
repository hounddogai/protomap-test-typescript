import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalRewardSummaryEngine } from "./global-reward-summary-engine.js";
import { newGlobalRewardSummary } from "./global-reward-summary.js";

test("GlobalRewardSummaryEngine keeps results within bounds", () => {
  const engine = defaultGlobalRewardSummaryEngine(flags.newRegistry());
  const item = newGlobalRewardSummary("code-335", "title-407");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
