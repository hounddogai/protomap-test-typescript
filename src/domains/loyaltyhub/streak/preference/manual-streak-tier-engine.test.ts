import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualStreakTierEngine } from "./manual-streak-tier-engine.js";
import { newManualStreakTier } from "./manual-streak-tier.js";

test("ManualStreakTierEngine keeps results within bounds", () => {
  const engine = defaultManualStreakTierEngine();
  const item = newManualStreakTier("code-263", "name-48");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
