import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackBranchPlanView, toFallbackBranchPlanViews } from "./fallback-branch-plan-view.js";
import { newFallbackBranchPlan } from "./fallback-branch-plan.js";

test("FallbackBranchPlanView shows the status in capitals", () => {
  const item = newFallbackBranchPlan("code-140", "name-598");
  const view = toFallbackBranchPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackBranchPlanViews([item, item]).length, 2, "views");
});
