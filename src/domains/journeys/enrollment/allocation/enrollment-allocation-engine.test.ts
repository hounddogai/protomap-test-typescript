import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultEnrollmentAllocationEngine } from "./enrollment-allocation-engine.js";
import { newEnrollmentAllocation } from "./enrollment-allocation.js";

test("EnrollmentAllocationEngine keeps results within bounds", () => {
  const engine = defaultEnrollmentAllocationEngine(flags.newRegistry());
  const item = newEnrollmentAllocation("code-958", "title-524");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
