import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredBadgePlanView, toTieredBadgePlanViews } from "./tiered-badge-plan-view.js";
import { newTieredBadgePlan } from "./tiered-badge-plan.js";

test("TieredBadgePlanView shows the status in capitals", () => {
  const item = newTieredBadgePlan("code-826", "name-985");
  const view = toTieredBadgePlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredBadgePlanViews([item, item]).length, 2, "views");
});
