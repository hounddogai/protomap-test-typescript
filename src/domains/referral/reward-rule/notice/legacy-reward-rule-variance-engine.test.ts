import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyRewardRuleVarianceEngine } from "./legacy-reward-rule-variance-engine.js";
import { newLegacyRewardRuleVariance } from "./legacy-reward-rule-variance.js";

test("LegacyRewardRuleVarianceEngine keeps results within bounds", () => {
  const engine = defaultLegacyRewardRuleVarianceEngine(flags.newRegistry());
  const item = newLegacyRewardRuleVariance("code-809", "name-249");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
