import assert from "node:assert/strict";
import { test } from "node:test";
import { toDoubleOptInPlanView, toDoubleOptInPlanViews } from "./double-opt-in-plan-view.js";
import { newDoubleOptInPlan } from "./double-opt-in-plan.js";

test("DoubleOptInPlanView shows the status in capitals", () => {
  const item = newDoubleOptInPlan("code-52", "label-665");
  const view = toDoubleOptInPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDoubleOptInPlanViews([item, item]).length, 2, "views");
});
