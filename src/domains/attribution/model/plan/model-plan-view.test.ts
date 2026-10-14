import assert from "node:assert/strict";
import { test } from "node:test";
import { toModelPlanView, toModelPlanViews } from "./model-plan-view.js";
import { newModelPlan } from "./model-plan.js";

test("ModelPlanView shows the status in capitals", () => {
  const item = newModelPlan("code-409", "title-51");
  const view = toModelPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toModelPlanViews([item, item]).length, 2, "views");
});
