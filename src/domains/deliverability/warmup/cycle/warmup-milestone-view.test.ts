import assert from "node:assert/strict";
import { test } from "node:test";
import { toWarmupMilestoneView, toWarmupMilestoneViews } from "./warmup-milestone-view.js";
import { newWarmupMilestone } from "./warmup-milestone.js";

test("WarmupMilestoneView shows the status in capitals", () => {
  const item = newWarmupMilestone("code-222", "label-672");
  const view = toWarmupMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWarmupMilestoneViews([item, item]).length, 2, "views");
});
