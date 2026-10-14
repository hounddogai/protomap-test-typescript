import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledFlightSlotEngine } from "./scheduled-flight-slot-engine.js";
import { newScheduledFlightSlot } from "./scheduled-flight-slot.js";

test("ScheduledFlightSlotEngine keeps results within bounds", () => {
  const engine = defaultScheduledFlightSlotEngine(flags.newRegistry());
  const item = newScheduledFlightSlot("code-970", "name-904");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
