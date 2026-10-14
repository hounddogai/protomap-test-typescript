import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveDoubleOptInPlanView, toAdaptiveDoubleOptInPlanViews } from "./adaptive-double-opt-in-plan-view.js";
import { newAdaptiveDoubleOptInPlan } from "./adaptive-double-opt-in-plan.js";

test("AdaptiveDoubleOptInPlanView shows the status in capitals", () => {
  const item = newAdaptiveDoubleOptInPlan("code-81", "label-378");
  const view = toAdaptiveDoubleOptInPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveDoubleOptInPlanViews([item, item]).length, 2, "views");
});
