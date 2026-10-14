import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedEnrollmentCycleEngine } from "./weighted-enrollment-cycle-engine.js";
import { newWeightedEnrollmentCycle } from "./weighted-enrollment-cycle.js";

test("WeightedEnrollmentCycleEngine keeps results within bounds", () => {
  const engine = defaultWeightedEnrollmentCycleEngine();
  const item = newWeightedEnrollmentCycle("code-576", "label-767");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
