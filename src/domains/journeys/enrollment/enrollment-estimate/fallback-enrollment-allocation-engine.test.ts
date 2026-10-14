import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackEnrollmentAllocationEngine } from "./fallback-enrollment-allocation-engine.js";
import { newFallbackEnrollmentAllocation } from "./fallback-enrollment-allocation.js";

test("FallbackEnrollmentAllocationEngine keeps results within bounds", () => {
  const engine = defaultFallbackEnrollmentAllocationEngine(flags.newRegistry());
  const item = newFallbackEnrollmentAllocation("code-486", "label-636");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
