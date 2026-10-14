import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualLevelPlanView, toManualLevelPlanViews } from "./manual-level-plan-view.js";
import { newManualLevelPlan } from "./manual-level-plan.js";

test("ManualLevelPlanView shows the status in capitals", () => {
  const item = newManualLevelPlan("code-260", "label-310");
  const view = toManualLevelPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualLevelPlanViews([item, item]).length, 2, "views");
});
