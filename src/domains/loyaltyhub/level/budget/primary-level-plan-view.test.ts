import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryLevelPlanView, toPrimaryLevelPlanViews } from "./primary-level-plan-view.js";
import { newPrimaryLevelPlan } from "./primary-level-plan.js";

test("PrimaryLevelPlanView shows the status in capitals", () => {
  const item = newPrimaryLevelPlan("code-669", "name-793");
  const view = toPrimaryLevelPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryLevelPlanViews([item, item]).length, 2, "views");
});
