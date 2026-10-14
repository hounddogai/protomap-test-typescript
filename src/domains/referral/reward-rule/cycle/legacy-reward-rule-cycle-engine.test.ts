import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyRewardRuleCycleEngine } from "./legacy-reward-rule-cycle-engine.js";
import { newLegacyRewardRuleCycle } from "./legacy-reward-rule-cycle.js";

test("LegacyRewardRuleCycleEngine keeps results within bounds", () => {
  const engine = defaultLegacyRewardRuleCycleEngine(flags.newRegistry());
  const item = newLegacyRewardRuleCycle("code-551", "name-709");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
