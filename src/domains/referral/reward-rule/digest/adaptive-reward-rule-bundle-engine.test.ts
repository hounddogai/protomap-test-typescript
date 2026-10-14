import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveRewardRuleBundleEngine } from "./adaptive-reward-rule-bundle-engine.js";
import { newAdaptiveRewardRuleBundle } from "./adaptive-reward-rule-bundle.js";

test("AdaptiveRewardRuleBundleEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveRewardRuleBundleEngine(flags.newRegistry());
  const item = newAdaptiveRewardRuleBundle("code-497", "label-891");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
