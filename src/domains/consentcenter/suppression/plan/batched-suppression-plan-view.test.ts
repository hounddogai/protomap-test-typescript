import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedSuppressionPlanView, toBatchedSuppressionPlanViews } from "./batched-suppression-plan-view.js";
import { newBatchedSuppressionPlan } from "./batched-suppression-plan.js";

test("BatchedSuppressionPlanView shows the status in capitals", () => {
  const item = newBatchedSuppressionPlan("code-980", "name-398");
  const view = toBatchedSuppressionPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedSuppressionPlanViews([item, item]).length, 2, "views");
});
