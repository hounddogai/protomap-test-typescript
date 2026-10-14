import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedProofAssignmentView, toWeightedProofAssignmentViews } from "./weighted-proof-assignment-view.js";
import { newWeightedProofAssignment } from "./weighted-proof-assignment.js";

test("WeightedProofAssignmentView shows the status in capitals", () => {
  const item = newWeightedProofAssignment("code-577", "name-347");
  const view = toWeightedProofAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedProofAssignmentViews([item, item]).length, 2, "views");
});
