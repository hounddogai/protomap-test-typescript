import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictLevelAssignmentView, toStrictLevelAssignmentViews } from "./strict-level-assignment-view.js";
import { newStrictLevelAssignment } from "./strict-level-assignment.js";

test("StrictLevelAssignmentView shows the status in capitals", () => {
  const item = newStrictLevelAssignment("code-26", "title-264");
  const view = toStrictLevelAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictLevelAssignmentViews([item, item]).length, 2, "views");
});
