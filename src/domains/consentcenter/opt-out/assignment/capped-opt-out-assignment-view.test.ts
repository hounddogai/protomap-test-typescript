import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedOptOutAssignmentView, toCappedOptOutAssignmentViews } from "./capped-opt-out-assignment-view.js";
import { newCappedOptOutAssignment } from "./capped-opt-out-assignment.js";

test("CappedOptOutAssignmentView shows the status in capitals", () => {
  const item = newCappedOptOutAssignment("code-621", "title-611");
  const view = toCappedOptOutAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedOptOutAssignmentViews([item, item]).length, 2, "views");
});
