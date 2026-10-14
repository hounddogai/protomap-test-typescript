import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPostPlanEngine } from "./post-plan-engine.js";
import { newPostPlan } from "./post-plan.js";

test("PostPlanEngine keeps results within bounds", () => {
  const engine = defaultPostPlanEngine();
  const item = newPostPlan("code-33", "label-441");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
