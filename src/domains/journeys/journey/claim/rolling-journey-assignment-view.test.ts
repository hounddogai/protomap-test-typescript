import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRollingJourneyAssignmentView,
  toRollingJourneyAssignmentViews,
} from "./rolling-journey-assignment-view.js";
import { newRollingJourneyAssignment } from "./rolling-journey-assignment.js";

test("RollingJourneyAssignmentView shows the status in capitals", () => {
  const item = newRollingJourneyAssignment("code-342", "title-794");
  const view = toRollingJourneyAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingJourneyAssignmentViews([item, item]).length, 2, "views");
});
