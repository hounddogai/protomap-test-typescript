import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBranchPlanEngine } from "./branch-plan-engine.js";
import { newBranchPlan } from "./branch-plan.js";

test("BranchPlanEngine keeps results within bounds", () => {
  const engine = defaultBranchPlanEngine();
  const item = newBranchPlan("code-360", "label-709");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
