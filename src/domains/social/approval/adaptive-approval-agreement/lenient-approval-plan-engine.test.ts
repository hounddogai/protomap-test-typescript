import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientApprovalPlanEngine } from "./lenient-approval-plan-engine.js";
import { newLenientApprovalPlan } from "./lenient-approval-plan.js";

test("LenientApprovalPlanEngine keeps results within bounds", () => {
  const engine = defaultLenientApprovalPlanEngine(flags.newRegistry());
  const item = newLenientApprovalPlan("code-507", "name-869");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
