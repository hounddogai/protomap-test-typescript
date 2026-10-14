import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedFlightPlanEngine } from "./weighted-flight-plan-engine.js";
import { newWeightedFlightPlan } from "./weighted-flight-plan.js";

test("WeightedFlightPlanEngine keeps results within bounds", () => {
  const engine = defaultWeightedFlightPlanEngine(flags.newRegistry());
  const item = newWeightedFlightPlan("code-776", "name-995");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
