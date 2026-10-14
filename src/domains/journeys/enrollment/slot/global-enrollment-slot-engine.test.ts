import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalEnrollmentSlotEngine } from "./global-enrollment-slot-engine.js";
import { newGlobalEnrollmentSlot } from "./global-enrollment-slot.js";

test("GlobalEnrollmentSlotEngine keeps results within bounds", () => {
  const engine = defaultGlobalEnrollmentSlotEngine(flags.newRegistry());
  const item = newGlobalEnrollmentSlot("code-857", "title-273");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
