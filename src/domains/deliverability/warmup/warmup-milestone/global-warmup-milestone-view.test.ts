import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalWarmupMilestoneView, toGlobalWarmupMilestoneViews } from "./global-warmup-milestone-view.js";
import { newGlobalWarmupMilestone } from "./global-warmup-milestone.js";

test("GlobalWarmupMilestoneView shows the status in capitals", () => {
  const item = newGlobalWarmupMilestone("code-338", "name-743");
  const view = toGlobalWarmupMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalWarmupMilestoneViews([item, item]).length, 2, "views");
});
