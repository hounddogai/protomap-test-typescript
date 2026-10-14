import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptivePlacementSlotEngine } from "./adaptive-placement-slot-engine.js";
import { newAdaptivePlacementSlot } from "./adaptive-placement-slot.js";

test("AdaptivePlacementSlotEngine keeps results within bounds", () => {
  const engine = defaultAdaptivePlacementSlotEngine();
  const item = newAdaptivePlacementSlot("code-174", "label-251");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
