import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingWarmupMilestoneView, toRollingWarmupMilestoneViews } from "./rolling-warmup-milestone-view.js";
import { newRollingWarmupMilestone } from "./rolling-warmup-milestone.js";

test("RollingWarmupMilestoneView shows the status in capitals", () => {
  const item = newRollingWarmupMilestone("code-695", "label-264");
  const view = toRollingWarmupMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingWarmupMilestoneViews([item, item]).length, 2, "views");
});
