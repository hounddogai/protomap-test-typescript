import assert from "node:assert/strict";
import { test } from "node:test";
import { toFraudCheckPlanView, toFraudCheckPlanViews } from "./fraud-check-plan-view.js";
import { newFraudCheckPlan } from "./fraud-check-plan.js";

test("FraudCheckPlanView shows the status in capitals", () => {
  const item = newFraudCheckPlan("code-317", "label-562");
  const view = toFraudCheckPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFraudCheckPlanViews([item, item]).length, 2, "views");
});
