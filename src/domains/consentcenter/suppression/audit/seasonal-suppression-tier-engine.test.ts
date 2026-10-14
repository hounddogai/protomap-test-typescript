import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalSuppressionTierEngine } from "./seasonal-suppression-tier-engine.js";
import { newSeasonalSuppressionTier } from "./seasonal-suppression-tier.js";

test("SeasonalSuppressionTierEngine keeps results within bounds", () => {
  const engine = defaultSeasonalSuppressionTierEngine();
  const item = newSeasonalSuppressionTier("code-356", "title-903");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
