import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardRuleBundleEngine } from "./reward-rule-bundle-engine.js";
import { newRewardRuleBundle } from "./reward-rule-bundle.js";

test("RewardRuleBundleEngine keeps results within bounds", () => {
  const engine = defaultRewardRuleBundleEngine(flags.newRegistry());
  const item = newRewardRuleBundle("code-11", "name-220");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
