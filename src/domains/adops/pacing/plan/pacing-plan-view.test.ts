import assert from "node:assert/strict";
import { test } from "node:test";
import { toPacingPlanView, toPacingPlanViews } from "./pacing-plan-view.js";
import { newPacingPlan } from "./pacing-plan.js";

test("PacingPlanView shows the status in capitals", () => {
  const item = newPacingPlan("code-421", "label-12");
  const view = toPacingPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPacingPlanViews([item, item]).length, 2, "views");
});
