import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalComplaintSlotEngine } from "./global-complaint-slot-engine.js";
import { newGlobalComplaintSlot } from "./global-complaint-slot.js";

test("GlobalComplaintSlotEngine keeps results within bounds", () => {
  const engine = defaultGlobalComplaintSlotEngine();
  const item = newGlobalComplaintSlot("code-971", "name-362");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
