import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientApprovalPlanView, toLenientApprovalPlanViews } from "./lenient-approval-plan-view.js";
import { newLenientApprovalPlan } from "./lenient-approval-plan.js";

test("LenientApprovalPlanView shows the status in capitals", () => {
  const item = newLenientApprovalPlan("code-507", "name-869");
  const view = toLenientApprovalPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientApprovalPlanViews([item, item]).length, 2, "views");
});
