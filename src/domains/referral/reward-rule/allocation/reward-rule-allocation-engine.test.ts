import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardRuleAllocationEngine } from "./reward-rule-allocation-engine.js";
import { newRewardRuleAllocation } from "./reward-rule-allocation.js";

test("RewardRuleAllocationEngine keeps results within bounds", () => {
  const engine = defaultRewardRuleAllocationEngine(flags.newRegistry());
  const item = newRewardRuleAllocation("code-445", "label-266");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
