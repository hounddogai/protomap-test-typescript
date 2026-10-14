import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalTouchpointPlanView, toGlobalTouchpointPlanViews } from "./global-touchpoint-plan-view.js";
import { newGlobalTouchpointPlan } from "./global-touchpoint-plan.js";

test("GlobalTouchpointPlanView shows the status in capitals", () => {
  const item = newGlobalTouchpointPlan("code-401", "name-962");
  const view = toGlobalTouchpointPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalTouchpointPlanViews([item, item]).length, 2, "views");
});
