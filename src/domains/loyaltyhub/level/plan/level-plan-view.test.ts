import assert from "node:assert/strict";
import { test } from "node:test";
import { toLevelPlanView, toLevelPlanViews } from "./level-plan-view.js";
import { newLevelPlan } from "./level-plan.js";

test("LevelPlanView shows the status in capitals", () => {
  const item = newLevelPlan("code-924", "label-404");
  const view = toLevelPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLevelPlanViews([item, item]).length, 2, "views");
});
