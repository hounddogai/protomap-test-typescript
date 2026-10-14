import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictRewardRulePreferenceEngine } from "./strict-reward-rule-preference-engine.js";
import { newStrictRewardRulePreference } from "./strict-reward-rule-preference.js";

test("StrictRewardRulePreferenceEngine keeps results within bounds", () => {
  const engine = defaultStrictRewardRulePreferenceEngine(flags.newRegistry());
  const item = newStrictRewardRulePreference("code-235", "label-919");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
