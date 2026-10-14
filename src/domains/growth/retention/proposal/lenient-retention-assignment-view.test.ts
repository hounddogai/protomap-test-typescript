import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLenientRetentionAssignmentView,
  toLenientRetentionAssignmentViews,
} from "./lenient-retention-assignment-view.js";
import { newLenientRetentionAssignment } from "./lenient-retention-assignment.js";

test("LenientRetentionAssignmentView shows the status in capitals", () => {
  const item = newLenientRetentionAssignment("code-844", "name-566");
  const view = toLenientRetentionAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientRetentionAssignmentViews([item, item]).length, 2, "views");
});
