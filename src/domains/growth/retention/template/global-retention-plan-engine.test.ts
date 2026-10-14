import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalRetentionPlanEngine } from "./global-retention-plan-engine.js";
import { newGlobalRetentionPlan } from "./global-retention-plan.js";

test("GlobalRetentionPlanEngine keeps results within bounds", () => {
  const engine = defaultGlobalRetentionPlanEngine();
  const item = newGlobalRetentionPlan("code-141", "name-921");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
