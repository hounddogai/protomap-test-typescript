import assert from "node:assert/strict";
import { test } from "node:test";
import { toBounceAssignmentView, toBounceAssignmentViews } from "./bounce-assignment-view.js";
import { newBounceAssignment } from "./bounce-assignment.js";

test("BounceAssignmentView shows the status in capitals", () => {
  const item = newBounceAssignment("code-529", "title-24");
  const view = toBounceAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBounceAssignmentViews([item, item]).length, 2, "views");
});
