import assert from "node:assert/strict";
import { test } from "node:test";
import { toCsatAssignmentView, toCsatAssignmentViews } from "./csat-assignment-view.js";
import { newCsatAssignment } from "./csat-assignment.js";

test("CsatAssignmentView shows the status in capitals", () => {
  const item = newCsatAssignment("code-610", "name-971");
  const view = toCsatAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCsatAssignmentViews([item, item]).length, 2, "views");
});
