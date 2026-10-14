import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLegacyReputationAssignmentView,
  toLegacyReputationAssignmentViews,
} from "./legacy-reputation-assignment-view.js";
import { newLegacyReputationAssignment } from "./legacy-reputation-assignment.js";

test("LegacyReputationAssignmentView shows the status in capitals", () => {
  const item = newLegacyReputationAssignment("code-531", "label-802");
  const view = toLegacyReputationAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyReputationAssignmentViews([item, item]).length, 2, "views");
});
