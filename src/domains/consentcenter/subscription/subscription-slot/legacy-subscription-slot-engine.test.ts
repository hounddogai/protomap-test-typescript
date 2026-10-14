import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacySubscriptionSlotEngine } from "./legacy-subscription-slot-engine.js";
import { newLegacySubscriptionSlot } from "./legacy-subscription-slot.js";

test("LegacySubscriptionSlotEngine keeps results within bounds", () => {
  const engine = defaultLegacySubscriptionSlotEngine();
  const item = newLegacySubscriptionSlot("code-363", "label-197");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
