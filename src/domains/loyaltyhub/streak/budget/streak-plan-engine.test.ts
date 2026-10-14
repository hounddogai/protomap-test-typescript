import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStreakPlanEngine } from "./streak-plan-engine.js";
import { newStreakPlan } from "./streak-plan.js";

test("StreakPlanEngine keeps results within bounds", () => {
  const engine = defaultStreakPlanEngine(flags.newRegistry());
  const item = newStreakPlan("code-419", "title-458");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
