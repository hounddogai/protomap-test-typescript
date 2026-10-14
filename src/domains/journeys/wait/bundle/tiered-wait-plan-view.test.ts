import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredWaitPlanView, toTieredWaitPlanViews } from "./tiered-wait-plan-view.js";
import { newTieredWaitPlan } from "./tiered-wait-plan.js";

test("TieredWaitPlanView shows the status in capitals", () => {
  const item = newTieredWaitPlan("code-994", "name-252");
  const view = toTieredWaitPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredWaitPlanViews([item, item]).length, 2, "views");
});
