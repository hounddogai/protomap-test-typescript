import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStreakTierEngine } from "./streak-tier-engine.js";
import { newStreakTier } from "./streak-tier.js";

test("StreakTierEngine keeps results within bounds", () => {
  const engine = defaultStreakTierEngine();
  const item = newStreakTier("code-534", "title-824");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
