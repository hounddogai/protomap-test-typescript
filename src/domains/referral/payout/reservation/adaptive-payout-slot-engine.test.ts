import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptivePayoutSlotEngine } from "./adaptive-payout-slot-engine.js";
import { newAdaptivePayoutSlot } from "./adaptive-payout-slot.js";

test("AdaptivePayoutSlotEngine keeps results within bounds", () => {
  const engine = defaultAdaptivePayoutSlotEngine();
  const item = newAdaptivePayoutSlot("code-759", "title-758");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
