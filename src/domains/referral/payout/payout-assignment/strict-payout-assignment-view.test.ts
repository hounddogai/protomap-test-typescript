import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictPayoutAssignmentView, toStrictPayoutAssignmentViews } from "./strict-payout-assignment-view.js";
import { newStrictPayoutAssignment } from "./strict-payout-assignment.js";

test("StrictPayoutAssignmentView shows the status in capitals", () => {
  const item = newStrictPayoutAssignment("code-531", "label-686");
  const view = toStrictPayoutAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictPayoutAssignmentViews([item, item]).length, 2, "views");
});
