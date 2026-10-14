import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryProofAssignmentView, toPrimaryProofAssignmentViews } from "./primary-proof-assignment-view.js";
import { newPrimaryProofAssignment } from "./primary-proof-assignment.js";

test("PrimaryProofAssignmentView shows the status in capitals", () => {
  const item = newPrimaryProofAssignment("code-84", "title-255");
  const view = toPrimaryProofAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryProofAssignmentViews([item, item]).length, 2, "views");
});
