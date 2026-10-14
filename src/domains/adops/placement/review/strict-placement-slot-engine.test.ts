import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictPlacementSlotEngine } from "./strict-placement-slot-engine.js";
import { newStrictPlacementSlot } from "./strict-placement-slot.js";

test("StrictPlacementSlotEngine keeps results within bounds", () => {
  const engine = defaultStrictPlacementSlotEngine();
  const item = newStrictPlacementSlot("code-400", "name-517");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
