import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyLevelTierEngine } from "./legacy-level-tier-engine.js";
import { newLegacyLevelTier } from "./legacy-level-tier.js";

test("LegacyLevelTierEngine keeps results within bounds", () => {
  const engine = defaultLegacyLevelTierEngine(flags.newRegistry());
  const item = newLegacyLevelTier("code-45", "title-550");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
