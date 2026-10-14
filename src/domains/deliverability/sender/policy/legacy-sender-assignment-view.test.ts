import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacySenderAssignmentView, toLegacySenderAssignmentViews } from "./legacy-sender-assignment-view.js";
import { newLegacySenderAssignment } from "./legacy-sender-assignment.js";

test("LegacySenderAssignmentView shows the status in capitals", () => {
  const item = newLegacySenderAssignment("code-935", "name-651");
  const view = toLegacySenderAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacySenderAssignmentViews([item, item]).length, 2, "views");
});
