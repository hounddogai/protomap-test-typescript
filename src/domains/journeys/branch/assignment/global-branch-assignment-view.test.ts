import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalBranchAssignmentView, toGlobalBranchAssignmentViews } from "./global-branch-assignment-view.js";
import { newGlobalBranchAssignment } from "./global-branch-assignment.js";

test("GlobalBranchAssignmentView shows the status in capitals", () => {
  const item = newGlobalBranchAssignment("code-993", "name-587");
  const view = toGlobalBranchAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalBranchAssignmentViews([item, item]).length, 2, "views");
});
