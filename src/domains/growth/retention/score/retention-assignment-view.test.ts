import assert from "node:assert/strict";
import { test } from "node:test";
import { toRetentionAssignmentView, toRetentionAssignmentViews } from "./retention-assignment-view.js";
import { newRetentionAssignment } from "./retention-assignment.js";

test("RetentionAssignmentView shows the status in capitals", () => {
  const item = newRetentionAssignment("code-696", "label-635");
  const view = toRetentionAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRetentionAssignmentViews([item, item]).length, 2, "views");
});
