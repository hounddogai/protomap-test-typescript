import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedTouchpointAssignmentView,
  toWeightedTouchpointAssignmentViews,
} from "./weighted-touchpoint-assignment-view.js";
import { newWeightedTouchpointAssignment } from "./weighted-touchpoint-assignment.js";

test("WeightedTouchpointAssignmentView shows the status in capitals", () => {
  const item = newWeightedTouchpointAssignment("code-84", "label-815");
  const view = toWeightedTouchpointAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedTouchpointAssignmentViews([item, item]).length, 2, "views");
});
