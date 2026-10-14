import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveRewardRuleSummaryEngine } from "./adaptive-reward-rule-summary-engine.js";
import { newAdaptiveRewardRuleSummary } from "./adaptive-reward-rule-summary.js";

test("AdaptiveRewardRuleSummaryEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveRewardRuleSummaryEngine();
  const item = newAdaptiveRewardRuleSummary("code-786", "name-60");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
