import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedOptOutPlanView, toBatchedOptOutPlanViews } from "./batched-opt-out-plan-view.js";
import { newBatchedOptOutPlan } from "./batched-opt-out-plan.js";

test("BatchedOptOutPlanView shows the status in capitals", () => {
  const item = newBatchedOptOutPlan("code-966", "label-600");
  const view = toBatchedOptOutPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedOptOutPlanViews([item, item]).length, 2, "views");
});
