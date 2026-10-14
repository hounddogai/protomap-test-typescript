import assert from "node:assert/strict";
import { test } from "node:test";
import { toPayoutPlanView, toPayoutPlanViews } from "./payout-plan-view.js";
import { newPayoutPlan } from "./payout-plan.js";

test("PayoutPlanView shows the status in capitals", () => {
  const item = newPayoutPlan("code-66", "name-361");
  const view = toPayoutPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPayoutPlanViews([item, item]).length, 2, "views");
});
