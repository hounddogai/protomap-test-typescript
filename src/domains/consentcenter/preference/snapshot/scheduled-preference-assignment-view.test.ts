import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledPreferenceAssignmentView,
  toScheduledPreferenceAssignmentViews,
} from "./scheduled-preference-assignment-view.js";
import { newScheduledPreferenceAssignment } from "./scheduled-preference-assignment.js";

test("ScheduledPreferenceAssignmentView shows the status in capitals", () => {
  const item = newScheduledPreferenceAssignment("code-835", "title-525");
  const view = toScheduledPreferenceAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledPreferenceAssignmentViews([item, item]).length, 2, "views");
});
