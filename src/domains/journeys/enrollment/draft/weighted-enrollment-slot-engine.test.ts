import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedEnrollmentSlotEngine } from "./weighted-enrollment-slot-engine.js";
import { newWeightedEnrollmentSlot } from "./weighted-enrollment-slot.js";

test("WeightedEnrollmentSlotEngine keeps results within bounds", () => {
  const engine = defaultWeightedEnrollmentSlotEngine(flags.newRegistry());
  const item = newWeightedEnrollmentSlot("code-204", "title-774");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
