import assert from "node:assert/strict";
import { test } from "node:test";
import { toFlightPlanView, toFlightPlanViews } from "./flight-plan-view.js";
import { newFlightPlan } from "./flight-plan.js";

test("FlightPlanView shows the status in capitals", () => {
  const item = newFlightPlan("code-365", "title-273");
  const view = toFlightPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFlightPlanViews([item, item]).length, 2, "views");
});
