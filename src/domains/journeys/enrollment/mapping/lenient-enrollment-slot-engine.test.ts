import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientEnrollmentSlotEngine } from "./lenient-enrollment-slot-engine.js";
import { newLenientEnrollmentSlot } from "./lenient-enrollment-slot.js";

test("LenientEnrollmentSlotEngine keeps results within bounds", () => {
  const engine = defaultLenientEnrollmentSlotEngine(flags.newRegistry());
  const item = newLenientEnrollmentSlot("code-956", "name-823");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
