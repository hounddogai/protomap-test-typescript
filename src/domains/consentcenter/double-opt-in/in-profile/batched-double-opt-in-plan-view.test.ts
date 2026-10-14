import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedDoubleOptInPlanView, toBatchedDoubleOptInPlanViews } from "./batched-double-opt-in-plan-view.js";
import { newBatchedDoubleOptInPlan } from "./batched-double-opt-in-plan.js";

test("BatchedDoubleOptInPlanView shows the status in capitals", () => {
  const item = newBatchedDoubleOptInPlan("code-325", "name-282");
  const view = toBatchedDoubleOptInPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedDoubleOptInPlanViews([item, item]).length, 2, "views");
});
