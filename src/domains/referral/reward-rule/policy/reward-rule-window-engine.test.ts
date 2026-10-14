import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRewardRuleWindowEngine } from "./reward-rule-window-engine.js";
import { newRewardRuleWindow } from "./reward-rule-window.js";

test("RewardRuleWindowEngine keeps results within bounds", () => {
  const engine = defaultRewardRuleWindowEngine();
  const item = newRewardRuleWindow("code-720", "name-859");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
