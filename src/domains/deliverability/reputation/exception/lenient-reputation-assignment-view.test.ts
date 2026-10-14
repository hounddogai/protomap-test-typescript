import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLenientReputationAssignmentView,
  toLenientReputationAssignmentViews,
} from "./lenient-reputation-assignment-view.js";
import { newLenientReputationAssignment } from "./lenient-reputation-assignment.js";

test("LenientReputationAssignmentView shows the status in capitals", () => {
  const item = newLenientReputationAssignment("code-544", "name-73");
  const view = toLenientReputationAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientReputationAssignmentViews([item, item]).length, 2, "views");
});
