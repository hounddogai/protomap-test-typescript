import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyStreakTierEngine } from "./legacy-streak-tier-engine.js";
import { newLegacyStreakTier } from "./legacy-streak-tier.js";

test("LegacyStreakTierEngine keeps results within bounds", () => {
  const engine = defaultLegacyStreakTierEngine(flags.newRegistry());
  const item = newLegacyStreakTier("code-855", "name-675");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
