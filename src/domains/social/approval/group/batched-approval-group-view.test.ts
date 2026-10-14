import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedApprovalGroupView, toBatchedApprovalGroupViews } from "./batched-approval-group-view.js";
import { newBatchedApprovalGroup } from "./batched-approval-group.js";

test("BatchedApprovalGroupView shows the status in capitals", () => {
  const item = newBatchedApprovalGroup("code-272", "name-16");
  const view = toBatchedApprovalGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedApprovalGroupViews([item, item]).length, 2, "views");
});
