import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalLevelAssignmentView, toGlobalLevelAssignmentViews } from "./global-level-assignment-view.js";
import { newGlobalLevelAssignment } from "./global-level-assignment.js";

test("GlobalLevelAssignmentView shows the status in capitals", () => {
  const item = newGlobalLevelAssignment("code-463", "name-550");
  const view = toGlobalLevelAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalLevelAssignmentViews([item, item]).length, 2, "views");
});
