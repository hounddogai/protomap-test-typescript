import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveRedemptionPlanView, toAdaptiveRedemptionPlanViews } from "./adaptive-redemption-plan-view.js";
import { newAdaptiveRedemptionPlan } from "./adaptive-redemption-plan.js";

test("AdaptiveRedemptionPlanView shows the status in capitals", () => {
  const item = newAdaptiveRedemptionPlan("code-319", "title-782");
  const view = toAdaptiveRedemptionPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveRedemptionPlanViews([item, item]).length, 2, "views");
});
