import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedInsightPlanView, toCappedInsightPlanViews } from "./capped-insight-plan-view.js";
import { newCappedInsightPlan } from "./capped-insight-plan.js";

test("CappedInsightPlanView shows the status in capitals", () => {
  const item = newCappedInsightPlan("code-720", "name-239");
  const view = toCappedInsightPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedInsightPlanViews([item, item]).length, 2, "views");
});
