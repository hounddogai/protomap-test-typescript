import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualRewardRuleAdjustmentEngine } from "./manual-reward-rule-adjustment-engine.js";
import { newManualRewardRuleAdjustment } from "./manual-reward-rule-adjustment.js";

test("ManualRewardRuleAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultManualRewardRuleAdjustmentEngine(flags.newRegistry());
  const item = newManualRewardRuleAdjustment("code-41", "name-793");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
