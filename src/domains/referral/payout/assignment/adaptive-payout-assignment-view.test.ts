import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptivePayoutAssignmentView,
  toAdaptivePayoutAssignmentViews,
} from "./adaptive-payout-assignment-view.js";
import { newAdaptivePayoutAssignment } from "./adaptive-payout-assignment.js";

test("AdaptivePayoutAssignmentView shows the status in capitals", () => {
  const item = newAdaptivePayoutAssignment("code-554", "title-207");
  const view = toAdaptivePayoutAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptivePayoutAssignmentViews([item, item]).length, 2, "views");
});
