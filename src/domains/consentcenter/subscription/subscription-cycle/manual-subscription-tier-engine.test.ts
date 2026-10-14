import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualSubscriptionTierEngine } from "./manual-subscription-tier-engine.js";
import { newManualSubscriptionTier } from "./manual-subscription-tier.js";

test("ManualSubscriptionTierEngine keeps results within bounds", () => {
  const engine = defaultManualSubscriptionTierEngine();
  const item = newManualSubscriptionTier("code-294", "label-202");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
