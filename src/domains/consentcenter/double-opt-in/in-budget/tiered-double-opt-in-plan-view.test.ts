import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredDoubleOptInPlanView, toTieredDoubleOptInPlanViews } from "./tiered-double-opt-in-plan-view.js";
import { newTieredDoubleOptInPlan } from "./tiered-double-opt-in-plan.js";

test("TieredDoubleOptInPlanView shows the status in capitals", () => {
  const item = newTieredDoubleOptInPlan("code-611", "label-804");
  const view = toTieredDoubleOptInPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredDoubleOptInPlanViews([item, item]).length, 2, "views");
});
