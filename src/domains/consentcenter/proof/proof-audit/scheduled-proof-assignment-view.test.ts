import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledProofAssignmentView,
  toScheduledProofAssignmentViews,
} from "./scheduled-proof-assignment-view.js";
import { newScheduledProofAssignment } from "./scheduled-proof-assignment.js";

test("ScheduledProofAssignmentView shows the status in capitals", () => {
  const item = newScheduledProofAssignment("code-467", "name-415");
  const view = toScheduledProofAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledProofAssignmentViews([item, item]).length, 2, "views");
});
