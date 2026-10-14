import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultEnrollmentSlotEngine } from "./enrollment-slot-engine.js";
import { newEnrollmentSlot } from "./enrollment-slot.js";

test("EnrollmentSlotEngine keeps results within bounds", () => {
  const engine = defaultEnrollmentSlotEngine(flags.newRegistry());
  const item = newEnrollmentSlot("code-565", "title-316");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
