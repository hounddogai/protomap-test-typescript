import assert from "node:assert/strict";
import { test } from "node:test";
import { toReputationPlanView, toReputationPlanViews } from "./reputation-plan-view.js";
import { newReputationPlan } from "./reputation-plan.js";

test("ReputationPlanView shows the status in capitals", () => {
  const item = newReputationPlan("code-591", "title-4");
  const view = toReputationPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReputationPlanViews([item, item]).length, 2, "views");
});
