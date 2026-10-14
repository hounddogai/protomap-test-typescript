import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalWaitTierEngine } from "./seasonal-wait-tier-engine.js";
import { newSeasonalWaitTier } from "./seasonal-wait-tier.js";

test("SeasonalWaitTierEngine keeps results within bounds", () => {
  const engine = defaultSeasonalWaitTierEngine();
  const item = newSeasonalWaitTier("code-562", "name-480");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
