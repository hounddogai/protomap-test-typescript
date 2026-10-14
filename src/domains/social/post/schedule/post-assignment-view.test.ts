import assert from "node:assert/strict";
import { test } from "node:test";
import { toPostAssignmentView, toPostAssignmentViews } from "./post-assignment-view.js";
import { newPostAssignment } from "./post-assignment.js";

test("PostAssignmentView shows the status in capitals", () => {
  const item = newPostAssignment("code-58", "title-952");
  const view = toPostAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPostAssignmentViews([item, item]).length, 2, "views");
});
