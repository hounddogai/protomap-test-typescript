import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveDoubleOptInSlotEngine } from "./adaptive-double-opt-in-slot-engine.js";
import { newAdaptiveDoubleOptInSlot } from "./adaptive-double-opt-in-slot.js";

test("AdaptiveDoubleOptInSlotEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveDoubleOptInSlotEngine();
  const item = newAdaptiveDoubleOptInSlot("code-288", "label-812");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
