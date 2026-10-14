import assert from "node:assert/strict";
import { test } from "node:test";
import { toPayoutAssignmentView, toPayoutAssignmentViews } from "./payout-assignment-view.js";
import { newPayoutAssignment } from "./payout-assignment.js";

test("PayoutAssignmentView shows the status in capitals", () => {
  const item = newPayoutAssignment("code-153", "label-618");
  const view = toPayoutAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPayoutAssignmentViews([item, item]).length, 2, "views");
});
