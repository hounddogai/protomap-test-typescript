import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedDeflectionAssignmentView,
  toWeightedDeflectionAssignmentViews,
} from "./weighted-deflection-assignment-view.js";
import { newWeightedDeflectionAssignment } from "./weighted-deflection-assignment.js";

test("WeightedDeflectionAssignmentView shows the status in capitals", () => {
  const item = newWeightedDeflectionAssignment("code-995", "label-64");
  const view = toWeightedDeflectionAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedDeflectionAssignmentViews([item, item]).length, 2, "views");
});
