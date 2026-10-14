import assert from "node:assert/strict";
import { test } from "node:test";
import { toOptOutPlanView, toOptOutPlanViews } from "./opt-out-plan-view.js";
import { newOptOutPlan } from "./opt-out-plan.js";

test("OptOutPlanView shows the status in capitals", () => {
  const item = newOptOutPlan("code-805", "name-39");
  const view = toOptOutPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toOptOutPlanViews([item, item]).length, 2, "views");
});
