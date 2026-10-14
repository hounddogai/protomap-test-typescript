import assert from "node:assert/strict";
import { test } from "node:test";
import { toModelAssignmentView, toModelAssignmentViews } from "./model-assignment-view.js";
import { newModelAssignment } from "./model-assignment.js";

test("ModelAssignmentView shows the status in capitals", () => {
  const item = newModelAssignment("code-28", "label-61");
  const view = toModelAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toModelAssignmentViews([item, item]).length, 2, "views");
});
