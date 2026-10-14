import assert from "node:assert/strict";
import { test } from "node:test";
import { toJourneyAssignmentView, toJourneyAssignmentViews } from "./journey-assignment-view.js";
import { newJourneyAssignment } from "./journey-assignment.js";

test("JourneyAssignmentView shows the status in capitals", () => {
  const item = newJourneyAssignment("code-462", "title-913");
  const view = toJourneyAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toJourneyAssignmentViews([item, item]).length, 2, "views");
});
