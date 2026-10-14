import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultFraudCheckPlanView, toDefaultFraudCheckPlanViews } from "./default-fraud-check-plan-view.js";
import { newDefaultFraudCheckPlan } from "./default-fraud-check-plan.js";

test("DefaultFraudCheckPlanView shows the status in capitals", () => {
  const item = newDefaultFraudCheckPlan("code-721", "name-816");
  const view = toDefaultFraudCheckPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultFraudCheckPlanViews([item, item]).length, 2, "views");
});
