import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictCohortAssignmentView, toStrictCohortAssignmentViews } from "./strict-cohort-assignment-view.js";
import { newStrictCohortAssignment } from "./strict-cohort-assignment.js";

test("StrictCohortAssignmentView shows the status in capitals", () => {
  const item = newStrictCohortAssignment("code-768", "name-126");
  const view = toStrictCohortAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictCohortAssignmentViews([item, item]).length, 2, "views");
});
