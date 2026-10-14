import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledCreativeAssignmentView,
  toScheduledCreativeAssignmentViews,
} from "./scheduled-creative-assignment-view.js";
import { newScheduledCreativeAssignment } from "./scheduled-creative-assignment.js";

test("ScheduledCreativeAssignmentView shows the status in capitals", () => {
  const item = newScheduledCreativeAssignment("code-456", "title-708");
  const view = toScheduledCreativeAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledCreativeAssignmentViews([item, item]).length, 2, "views");
});
