import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredStepMilestoneView, toTieredStepMilestoneViews } from "./tiered-step-milestone-view.js";
import { newTieredStepMilestone } from "./tiered-step-milestone.js";

test("TieredStepMilestoneView shows the status in capitals", () => {
  const item = newTieredStepMilestone("code-44", "title-752");
  const view = toTieredStepMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredStepMilestoneViews([item, item]).length, 2, "views");
});
