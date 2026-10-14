import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledBadgeMilestoneView, toScheduledBadgeMilestoneViews } from "./scheduled-badge-milestone-view.js";
import { newScheduledBadgeMilestone } from "./scheduled-badge-milestone.js";

test("ScheduledBadgeMilestoneView shows the status in capitals", () => {
  const item = newScheduledBadgeMilestone("code-518", "name-267");
  const view = toScheduledBadgeMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledBadgeMilestoneViews([item, item]).length, 2, "views");
});
