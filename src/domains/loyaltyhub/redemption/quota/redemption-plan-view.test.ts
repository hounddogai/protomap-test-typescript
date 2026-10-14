import assert from "node:assert/strict";
import { test } from "node:test";
import { toRedemptionPlanView, toRedemptionPlanViews } from "./redemption-plan-view.js";
import { newRedemptionPlan } from "./redemption-plan.js";

test("RedemptionPlanView shows the status in capitals", () => {
  const item = newRedemptionPlan("code-19", "name-507");
  const view = toRedemptionPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRedemptionPlanViews([item, item]).length, 2, "views");
});
