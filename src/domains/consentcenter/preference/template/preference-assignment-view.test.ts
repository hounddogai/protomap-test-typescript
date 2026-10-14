import assert from "node:assert/strict";
import { test } from "node:test";
import { toPreferenceAssignmentView, toPreferenceAssignmentViews } from "./preference-assignment-view.js";
import { newPreferenceAssignment } from "./preference-assignment.js";

test("PreferenceAssignmentView shows the status in capitals", () => {
  const item = newPreferenceAssignment("code-756", "label-745");
  const view = toPreferenceAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPreferenceAssignmentViews([item, item]).length, 2, "views");
});
