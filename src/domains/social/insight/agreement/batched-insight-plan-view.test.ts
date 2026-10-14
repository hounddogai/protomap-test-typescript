import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedInsightPlanView, toBatchedInsightPlanViews } from "./batched-insight-plan-view.js";
import { newBatchedInsightPlan } from "./batched-insight-plan.js";

test("BatchedInsightPlanView shows the status in capitals", () => {
  const item = newBatchedInsightPlan("code-832", "name-564");
  const view = toBatchedInsightPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedInsightPlanViews([item, item]).length, 2, "views");
});
