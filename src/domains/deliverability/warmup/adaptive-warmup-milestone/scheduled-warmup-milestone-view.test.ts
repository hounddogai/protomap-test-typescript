import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledWarmupMilestoneView,
  toScheduledWarmupMilestoneViews,
} from "./scheduled-warmup-milestone-view.js";
import { newScheduledWarmupMilestone } from "./scheduled-warmup-milestone.js";

test("ScheduledWarmupMilestoneView shows the status in capitals", () => {
  const item = newScheduledWarmupMilestone("code-343", "label-451");
  const view = toScheduledWarmupMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledWarmupMilestoneViews([item, item]).length, 2, "views");
});
