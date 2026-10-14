import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientFlightSlotEngine } from "./lenient-flight-slot-engine.js";
import { newLenientFlightSlot } from "./lenient-flight-slot.js";

test("LenientFlightSlotEngine keeps results within bounds", () => {
  const engine = defaultLenientFlightSlotEngine(flags.newRegistry());
  const item = newLenientFlightSlot("code-775", "title-643");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
