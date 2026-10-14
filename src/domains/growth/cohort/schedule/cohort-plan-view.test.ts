import assert from "node:assert/strict";
import { test } from "node:test";
import { toCohortPlanView, toCohortPlanViews } from "./cohort-plan-view.js";
import { newCohortPlan } from "./cohort-plan.js";

test("CohortPlanView shows the status in capitals", () => {
  const item = newCohortPlan("code-451", "name-449");
  const view = toCohortPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCohortPlanViews([item, item]).length, 2, "views");
});
