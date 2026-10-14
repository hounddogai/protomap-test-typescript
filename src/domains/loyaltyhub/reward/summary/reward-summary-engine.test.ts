import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardSummaryEngine } from "./reward-summary-engine.js";
import { newRewardSummary } from "./reward-summary.js";

test("RewardSummaryEngine keeps results within bounds", () => {
  const engine = defaultRewardSummaryEngine(flags.newRegistry());
  const item = newRewardSummary("code-12", "name-705");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
