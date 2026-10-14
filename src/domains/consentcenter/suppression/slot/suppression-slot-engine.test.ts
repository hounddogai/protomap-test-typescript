import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSuppressionSlotEngine } from "./suppression-slot-engine.js";
import { newSuppressionSlot } from "./suppression-slot.js";

test("SuppressionSlotEngine keeps results within bounds", () => {
  const engine = defaultSuppressionSlotEngine(flags.newRegistry());
  const item = newSuppressionSlot("code-913", "label-611");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
