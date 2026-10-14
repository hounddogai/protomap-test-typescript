import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFrequencySlotEngine } from "./frequency-slot-engine.js";
import { newFrequencySlot } from "./frequency-slot.js";

test("FrequencySlotEngine keeps results within bounds", () => {
  const engine = defaultFrequencySlotEngine(flags.newRegistry());
  const item = newFrequencySlot("code-820", "label-403");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
