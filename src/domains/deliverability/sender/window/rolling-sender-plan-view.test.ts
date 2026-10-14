import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingSenderPlanView, toRollingSenderPlanViews } from "./rolling-sender-plan-view.js";
import { newRollingSenderPlan } from "./rolling-sender-plan.js";

test("RollingSenderPlanView shows the status in capitals", () => {
  const item = newRollingSenderPlan("code-794", "title-884");
  const view = toRollingSenderPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingSenderPlanViews([item, item]).length, 2, "views");
});
