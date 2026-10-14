import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalTouchpointPlanView, toSeasonalTouchpointPlanViews } from "./seasonal-touchpoint-plan-view.js";
import { newSeasonalTouchpointPlan } from "./seasonal-touchpoint-plan.js";

test("SeasonalTouchpointPlanView shows the status in capitals", () => {
  const item = newSeasonalTouchpointPlan("code-253", "title-719");
  const view = toSeasonalTouchpointPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalTouchpointPlanViews([item, item]).length, 2, "views");
});
