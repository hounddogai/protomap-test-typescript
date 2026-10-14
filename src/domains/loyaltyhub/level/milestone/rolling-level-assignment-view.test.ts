import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingLevelAssignmentView, toRollingLevelAssignmentViews } from "./rolling-level-assignment-view.js";
import { newRollingLevelAssignment } from "./rolling-level-assignment.js";

test("RollingLevelAssignmentView shows the status in capitals", () => {
  const item = newRollingLevelAssignment("code-945", "name-446");
  const view = toRollingLevelAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingLevelAssignmentViews([item, item]).length, 2, "views");
});
