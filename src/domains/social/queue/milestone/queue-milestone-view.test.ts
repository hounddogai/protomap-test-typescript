import assert from "node:assert/strict";
import { test } from "node:test";
import { toQueueMilestoneView, toQueueMilestoneViews } from "./queue-milestone-view.js";
import { newQueueMilestone } from "./queue-milestone.js";

test("QueueMilestoneView shows the status in capitals", () => {
  const item = newQueueMilestone("code-721", "name-583");
  const view = toQueueMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toQueueMilestoneViews([item, item]).length, 2, "views");
});
