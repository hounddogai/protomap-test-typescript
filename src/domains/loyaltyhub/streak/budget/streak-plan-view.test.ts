import assert from "node:assert/strict";
import { test } from "node:test";
import { toStreakPlanView, toStreakPlanViews } from "./streak-plan-view.js";
import { newStreakPlan } from "./streak-plan.js";

test("StreakPlanView shows the status in capitals", () => {
  const item = newStreakPlan("code-419", "title-458");
  const view = toStreakPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStreakPlanViews([item, item]).length, 2, "views");
});
