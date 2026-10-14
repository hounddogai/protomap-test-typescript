import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualFlightPlanView, toManualFlightPlanViews } from "./manual-flight-plan-view.js";
import { newManualFlightPlan } from "./manual-flight-plan.js";

test("ManualFlightPlanView shows the status in capitals", () => {
  const item = newManualFlightPlan("code-501", "name-955");
  const view = toManualFlightPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualFlightPlanViews([item, item]).length, 2, "views");
});
