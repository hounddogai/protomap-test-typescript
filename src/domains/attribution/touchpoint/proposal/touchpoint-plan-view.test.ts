import assert from "node:assert/strict";
import { test } from "node:test";
import { toTouchpointPlanView, toTouchpointPlanViews } from "./touchpoint-plan-view.js";
import { newTouchpointPlan } from "./touchpoint-plan.js";

test("TouchpointPlanView shows the status in capitals", () => {
  const item = newTouchpointPlan("code-92", "title-585");
  const view = toTouchpointPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTouchpointPlanViews([item, item]).length, 2, "views");
});
