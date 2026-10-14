import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveStreakTierEngine } from "./adaptive-streak-tier-engine.js";
import { newAdaptiveStreakTier } from "./adaptive-streak-tier.js";

test("AdaptiveStreakTierEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveStreakTierEngine();
  const item = newAdaptiveStreakTier("code-561", "label-219");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
