import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLenientJourneyAssignmentView,
  toLenientJourneyAssignmentViews,
} from "./lenient-journey-assignment-view.js";
import { newLenientJourneyAssignment } from "./lenient-journey-assignment.js";

test("LenientJourneyAssignmentView shows the status in capitals", () => {
  const item = newLenientJourneyAssignment("code-116", "label-620");
  const view = toLenientJourneyAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientJourneyAssignmentViews([item, item]).length, 2, "views");
});
