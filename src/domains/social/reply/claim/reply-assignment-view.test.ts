import assert from "node:assert/strict";
import { test } from "node:test";
import { toReplyAssignmentView, toReplyAssignmentViews } from "./reply-assignment-view.js";
import { newReplyAssignment } from "./reply-assignment.js";

test("ReplyAssignmentView shows the status in capitals", () => {
  const item = newReplyAssignment("code-221", "name-923");
  const view = toReplyAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReplyAssignmentViews([item, item]).length, 2, "views");
});
