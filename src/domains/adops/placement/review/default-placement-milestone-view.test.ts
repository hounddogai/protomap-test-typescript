import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toDefaultPlacementMilestoneView,
  toDefaultPlacementMilestoneViews,
} from "./default-placement-milestone-view.js";
import { newDefaultPlacementMilestone } from "./default-placement-milestone.js";

test("DefaultPlacementMilestoneView shows the status in capitals", () => {
  const item = newDefaultPlacementMilestone("code-738", "name-709");
  const view = toDefaultPlacementMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultPlacementMilestoneViews([item, item]).length, 2, "views");
});
