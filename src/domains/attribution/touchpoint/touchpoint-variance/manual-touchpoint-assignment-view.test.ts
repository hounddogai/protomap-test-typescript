import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toManualTouchpointAssignmentView,
  toManualTouchpointAssignmentViews,
} from "./manual-touchpoint-assignment-view.js";
import { newManualTouchpointAssignment } from "./manual-touchpoint-assignment.js";

test("ManualTouchpointAssignmentView shows the status in capitals", () => {
  const item = newManualTouchpointAssignment("code-956", "name-254");
  const view = toManualTouchpointAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualTouchpointAssignmentViews([item, item]).length, 2, "views");
});
