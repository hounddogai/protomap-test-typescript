import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardRuleCycleEngine } from "./reward-rule-cycle-engine.js";
import { newRewardRuleCycle } from "./reward-rule-cycle.js";

test("RewardRuleCycleEngine keeps results within bounds", () => {
  const engine = defaultRewardRuleCycleEngine(flags.newRegistry());
  const item = newRewardRuleCycle("code-605", "label-230");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
