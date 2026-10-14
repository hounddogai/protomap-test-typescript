import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalRewardRuleRollupEngine } from "./global-reward-rule-rollup-engine.js";
import { newGlobalRewardRuleRollup } from "./global-reward-rule-rollup.js";

test("GlobalRewardRuleRollupEngine keeps results within bounds", () => {
  const engine = defaultGlobalRewardRuleRollupEngine(flags.newRegistry());
  const item = newGlobalRewardRuleRollup("code-806", "title-813");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
