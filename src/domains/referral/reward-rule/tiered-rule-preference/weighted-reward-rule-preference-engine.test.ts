import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedRewardRulePreferenceEngine } from "./weighted-reward-rule-preference-engine.js";
import { newWeightedRewardRulePreference } from "./weighted-reward-rule-preference.js";

test("WeightedRewardRulePreferenceEngine keeps results within bounds", () => {
  const engine = defaultWeightedRewardRulePreferenceEngine(flags.newRegistry());
  const item = newWeightedRewardRulePreference("code-281", "title-374");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
