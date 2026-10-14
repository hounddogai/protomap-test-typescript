import assert from "node:assert/strict";
import { test } from "node:test";
import { toBranchPlanView, toBranchPlanViews } from "./branch-plan-view.js";
import { newBranchPlan } from "./branch-plan.js";

test("BranchPlanView shows the status in capitals", () => {
  const item = newBranchPlan("code-360", "label-709");
  const view = toBranchPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBranchPlanViews([item, item]).length, 2, "views");
});
