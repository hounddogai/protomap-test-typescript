import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultOptOutPlanEngine } from "./opt-out-plan-engine.js";
import { newOptOutPlan } from "./opt-out-plan.js";

test("OptOutPlanEngine keeps results within bounds", () => {
  const engine = defaultOptOutPlanEngine(flags.newRegistry());
  const item = newOptOutPlan("code-805", "name-39");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
