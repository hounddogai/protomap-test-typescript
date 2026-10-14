import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toTieredReputationAssignmentView,
  toTieredReputationAssignmentViews,
} from "./tiered-reputation-assignment-view.js";
import { newTieredReputationAssignment } from "./tiered-reputation-assignment.js";

test("TieredReputationAssignmentView shows the status in capitals", () => {
  const item = newTieredReputationAssignment("code-127", "label-531");
  const view = toTieredReputationAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredReputationAssignmentViews([item, item]).length, 2, "views");
});
