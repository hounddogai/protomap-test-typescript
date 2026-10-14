import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedActivationSlotEngine } from "./capped-activation-slot-engine.js";
import { newCappedActivationSlot } from "./capped-activation-slot.js";

test("CappedActivationSlotEngine keeps results within bounds", () => {
  const engine = defaultCappedActivationSlotEngine();
  const item = newCappedActivationSlot("code-624", "name-231");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
