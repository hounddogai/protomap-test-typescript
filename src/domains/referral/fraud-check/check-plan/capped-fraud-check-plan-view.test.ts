import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedFraudCheckPlanView, toCappedFraudCheckPlanViews } from "./capped-fraud-check-plan-view.js";
import { newCappedFraudCheckPlan } from "./capped-fraud-check-plan.js";

test("CappedFraudCheckPlanView shows the status in capitals", () => {
  const item = newCappedFraudCheckPlan("code-188", "label-235");
  const view = toCappedFraudCheckPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedFraudCheckPlanViews([item, item]).length, 2, "views");
});
