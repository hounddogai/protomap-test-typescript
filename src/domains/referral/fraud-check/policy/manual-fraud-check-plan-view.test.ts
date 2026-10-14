import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualFraudCheckPlanView, toManualFraudCheckPlanViews } from "./manual-fraud-check-plan-view.js";
import { newManualFraudCheckPlan } from "./manual-fraud-check-plan.js";

test("ManualFraudCheckPlanView shows the status in capitals", () => {
  const item = newManualFraudCheckPlan("code-71", "title-720");
  const view = toManualFraudCheckPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualFraudCheckPlanViews([item, item]).length, 2, "views");
});
