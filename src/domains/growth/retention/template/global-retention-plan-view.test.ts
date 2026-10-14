import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalRetentionPlanView, toGlobalRetentionPlanViews } from "./global-retention-plan-view.js";
import { newGlobalRetentionPlan } from "./global-retention-plan.js";

test("GlobalRetentionPlanView shows the status in capitals", () => {
  const item = newGlobalRetentionPlan("code-141", "name-921");
  const view = toGlobalRetentionPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalRetentionPlanViews([item, item]).length, 2, "views");
});
