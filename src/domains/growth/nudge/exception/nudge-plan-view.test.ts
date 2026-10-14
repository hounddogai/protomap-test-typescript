import assert from "node:assert/strict";
import { test } from "node:test";
import { toNudgePlanView, toNudgePlanViews } from "./nudge-plan-view.js";
import { newNudgePlan } from "./nudge-plan.js";

test("NudgePlanView shows the status in capitals", () => {
  const item = newNudgePlan("code-966", "label-396");
  const view = toNudgePlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toNudgePlanViews([item, item]).length, 2, "views");
});
