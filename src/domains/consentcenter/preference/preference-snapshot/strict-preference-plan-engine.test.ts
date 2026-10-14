import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictPreferencePlanEngine } from "./strict-preference-plan-engine.js";
import { newStrictPreferencePlan } from "./strict-preference-plan.js";

test("StrictPreferencePlanEngine keeps results within bounds", () => {
  const engine = defaultStrictPreferencePlanEngine();
  const item = newStrictPreferencePlan("code-741", "title-447");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
