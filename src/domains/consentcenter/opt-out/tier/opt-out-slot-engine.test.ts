import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultOptOutSlotEngine } from "./opt-out-slot-engine.js";
import { newOptOutSlot } from "./opt-out-slot.js";

test("OptOutSlotEngine keeps results within bounds", () => {
  const engine = defaultOptOutSlotEngine(flags.newRegistry());
  const item = newOptOutSlot("code-546", "title-997");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
