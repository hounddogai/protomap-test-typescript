import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDoubleOptInPlanEngine } from "./double-opt-in-plan-engine.js";
import { newDoubleOptInPlan } from "./double-opt-in-plan.js";

test("DoubleOptInPlanEngine keeps results within bounds", () => {
  const engine = defaultDoubleOptInPlanEngine(flags.newRegistry());
  const item = newDoubleOptInPlan("code-52", "label-665");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
