import assert from "node:assert/strict";
import { test } from "node:test";
import { toWindowPlanView, toWindowPlanViews } from "./window-plan-view.js";
import { newWindowPlan } from "./window-plan.js";

test("WindowPlanView shows the status in capitals", () => {
  const item = newWindowPlan("code-112", "label-928");
  const view = toWindowPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWindowPlanViews([item, item]).length, 2, "views");
});
