import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientRewardRuleMilestoneEngine } from "./lenient-reward-rule-milestone-engine.js";
import { newLenientRewardRuleMilestone } from "./lenient-reward-rule-milestone.js";

test("LenientRewardRuleMilestoneEngine keeps results within bounds", () => {
  const engine = defaultLenientRewardRuleMilestoneEngine(flags.newRegistry());
  const item = newLenientRewardRuleMilestone("code-51", "title-500");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
