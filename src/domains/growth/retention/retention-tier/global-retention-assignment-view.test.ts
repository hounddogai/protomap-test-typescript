import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toGlobalRetentionAssignmentView,
  toGlobalRetentionAssignmentViews,
} from "./global-retention-assignment-view.js";
import { newGlobalRetentionAssignment } from "./global-retention-assignment.js";

test("GlobalRetentionAssignmentView shows the status in capitals", () => {
  const item = newGlobalRetentionAssignment("code-777", "title-951");
  const view = toGlobalRetentionAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalRetentionAssignmentViews([item, item]).length, 2, "views");
});
