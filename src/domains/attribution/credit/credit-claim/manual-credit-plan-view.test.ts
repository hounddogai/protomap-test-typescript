import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualCreditPlanView, toManualCreditPlanViews } from "./manual-credit-plan-view.js";
import { newManualCreditPlan } from "./manual-credit-plan.js";

test("ManualCreditPlanView shows the status in capitals", () => {
  const item = newManualCreditPlan("code-365", "label-354");
  const view = toManualCreditPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualCreditPlanViews([item, item]).length, 2, "views");
});
