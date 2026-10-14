import assert from "node:assert/strict";
import { test } from "node:test";
import { toTouchpointAssignmentView, toTouchpointAssignmentViews } from "./touchpoint-assignment-view.js";
import { newTouchpointAssignment } from "./touchpoint-assignment.js";

test("TouchpointAssignmentView shows the status in capitals", () => {
  const item = newTouchpointAssignment("code-737", "label-858");
  const view = toTouchpointAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTouchpointAssignmentViews([item, item]).length, 2, "views");
});
