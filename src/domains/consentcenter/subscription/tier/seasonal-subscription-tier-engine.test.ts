import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalSubscriptionTierEngine } from "./seasonal-subscription-tier-engine.js";
import { newSeasonalSubscriptionTier } from "./seasonal-subscription-tier.js";

test("SeasonalSubscriptionTierEngine keeps results within bounds", () => {
  const engine = defaultSeasonalSubscriptionTierEngine();
  const item = newSeasonalSubscriptionTier("code-759", "title-437");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
