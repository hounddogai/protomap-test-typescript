import assert from "node:assert/strict";
import { test } from "node:test";
import { toApprovalAssignmentView, toApprovalAssignmentViews } from "./approval-assignment-view.js";
import { newApprovalAssignment } from "./approval-assignment.js";

test("ApprovalAssignmentView shows the status in capitals", () => {
  const item = newApprovalAssignment("code-61", "title-716");
  const view = toApprovalAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toApprovalAssignmentViews([item, item]).length, 2, "views");
});
