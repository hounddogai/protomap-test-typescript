import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingInsightPlanView, toPendingInsightPlanViews } from "./pending-insight-plan-view.js";
import { newPendingInsightPlan } from "./pending-insight-plan.js";

test("PendingInsightPlanView shows the status in capitals", () => {
  const item = newPendingInsightPlan("code-692", "name-58");
  const view = toPendingInsightPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingInsightPlanViews([item, item]).length, 2, "views");
});
