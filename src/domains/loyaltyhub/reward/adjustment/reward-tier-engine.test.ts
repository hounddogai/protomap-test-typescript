import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardTierEngine } from "./reward-tier-engine.js";
import { newRewardTier } from "./reward-tier.js";

test("RewardTierEngine keeps results within bounds", () => {
  const engine = defaultRewardTierEngine(flags.newRegistry());
  const item = newRewardTier("code-167", "name-357");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
