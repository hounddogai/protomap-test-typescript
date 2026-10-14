import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingWaitMilestoneView, toPendingWaitMilestoneViews } from "./pending-wait-milestone-view.js";
import { newPendingWaitMilestone } from "./pending-wait-milestone.js";

test("PendingWaitMilestoneView shows the status in capitals", () => {
  const item = newPendingWaitMilestone("code-774", "title-818");
  const view = toPendingWaitMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingWaitMilestoneViews([item, item]).length, 2, "views");
});
