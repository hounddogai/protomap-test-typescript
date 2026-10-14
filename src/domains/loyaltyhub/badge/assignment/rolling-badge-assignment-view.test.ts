import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingBadgeAssignmentView, toRollingBadgeAssignmentViews } from "./rolling-badge-assignment-view.js";
import { newRollingBadgeAssignment } from "./rolling-badge-assignment.js";

test("RollingBadgeAssignmentView shows the status in capitals", () => {
  const item = newRollingBadgeAssignment("code-64", "label-677");
  const view = toRollingBadgeAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingBadgeAssignmentViews([item, item]).length, 2, "views");
});
