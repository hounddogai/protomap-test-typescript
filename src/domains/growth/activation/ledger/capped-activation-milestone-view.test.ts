import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toCappedActivationMilestoneView,
  toCappedActivationMilestoneViews,
} from "./capped-activation-milestone-view.js";
import { newCappedActivationMilestone } from "./capped-activation-milestone.js";

test("CappedActivationMilestoneView shows the status in capitals", () => {
  const item = newCappedActivationMilestone("code-401", "label-3");
  const view = toCappedActivationMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedActivationMilestoneViews([item, item]).length, 2, "views");
});
