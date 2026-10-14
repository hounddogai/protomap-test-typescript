import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryInsightPlanView, toPrimaryInsightPlanViews } from "./primary-insight-plan-view.js";
import { newPrimaryInsightPlan } from "./primary-insight-plan.js";

test("PrimaryInsightPlanView shows the status in capitals", () => {
  const item = newPrimaryInsightPlan("code-228", "title-721");
  const view = toPrimaryInsightPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryInsightPlanViews([item, item]).length, 2, "views");
});
