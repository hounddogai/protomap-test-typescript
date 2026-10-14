import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardRuleSlotEngine } from "./reward-rule-slot-engine.js";
import { newRewardRuleSlot } from "./reward-rule-slot.js";

test("RewardRuleSlotEngine keeps results within bounds", () => {
  const engine = defaultRewardRuleSlotEngine(flags.newRegistry());
  const item = newRewardRuleSlot("code-18", "label-955");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
