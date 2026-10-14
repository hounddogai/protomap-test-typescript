import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredStepAssignmentView, toTieredStepAssignmentViews } from "./tiered-step-assignment-view.js";
import { newTieredStepAssignment } from "./tiered-step-assignment.js";

test("TieredStepAssignmentView shows the status in capitals", () => {
  const item = newTieredStepAssignment("code-816", "name-880");
  const view = toTieredStepAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredStepAssignmentViews([item, item]).length, 2, "views");
});
