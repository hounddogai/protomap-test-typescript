import assert from "node:assert/strict";
import { test } from "node:test";
import { toSenderAssignmentView, toSenderAssignmentViews } from "./sender-assignment-view.js";
import { newSenderAssignment } from "./sender-assignment.js";

test("SenderAssignmentView shows the status in capitals", () => {
  const item = newSenderAssignment("code-58", "name-981");
  const view = toSenderAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSenderAssignmentViews([item, item]).length, 2, "views");
});
