import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedRewardRuleSummaryEngine } from "./weighted-reward-rule-summary-engine.js";
import { newWeightedRewardRuleSummary } from "./weighted-reward-rule-summary.js";

test("WeightedRewardRuleSummaryEngine keeps results within bounds", () => {
  const engine = defaultWeightedRewardRuleSummaryEngine();
  const item = newWeightedRewardRuleSummary("code-722", "label-565");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
