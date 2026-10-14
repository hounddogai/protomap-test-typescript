import assert from "node:assert/strict";
import { test } from "node:test";
import { toPlacementPlanView, toPlacementPlanViews } from "./placement-plan-view.js";
import { newPlacementPlan } from "./placement-plan.js";

test("PlacementPlanView shows the status in capitals", () => {
  const item = newPlacementPlan("code-3", "name-486");
  const view = toPlacementPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPlacementPlanViews([item, item]).length, 2, "views");
});
