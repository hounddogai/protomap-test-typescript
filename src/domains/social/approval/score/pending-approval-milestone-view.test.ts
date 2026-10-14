import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPendingApprovalMilestoneView,
  toPendingApprovalMilestoneViews,
} from "./pending-approval-milestone-view.js";
import { newPendingApprovalMilestone } from "./pending-approval-milestone.js";

test("PendingApprovalMilestoneView shows the status in capitals", () => {
  const item = newPendingApprovalMilestone("code-341", "title-3");
  const view = toPendingApprovalMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingApprovalMilestoneViews([item, item]).length, 2, "views");
});
