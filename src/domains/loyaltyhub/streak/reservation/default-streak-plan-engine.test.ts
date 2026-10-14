import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultStreakPlanEngine } from "./default-streak-plan-engine.js";
import { newDefaultStreakPlan } from "./default-streak-plan.js";

test("DefaultStreakPlanEngine keeps results within bounds", () => {
  const engine = defaultDefaultStreakPlanEngine(flags.newRegistry());
  const item = newDefaultStreakPlan("code-551", "name-315");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
