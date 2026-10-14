import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultComplaintSlotEngine } from "./complaint-slot-engine.js";
import { newComplaintSlot } from "./complaint-slot.js";

test("ComplaintSlotEngine keeps results within bounds", () => {
  const engine = defaultComplaintSlotEngine();
  const item = newComplaintSlot("code-923", "title-968");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
