import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRewardRuleGroupEngine } from "./reward-rule-group-engine.js";
import { newRewardRuleGroup } from "./reward-rule-group.js";

test("RewardRuleGroupEngine keeps results within bounds", () => {
  const engine = defaultRewardRuleGroupEngine();
  const item = newRewardRuleGroup("code-179", "name-693");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
