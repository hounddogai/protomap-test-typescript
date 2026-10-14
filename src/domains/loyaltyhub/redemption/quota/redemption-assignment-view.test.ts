import assert from "node:assert/strict";
import { test } from "node:test";
import { toRedemptionAssignmentView, toRedemptionAssignmentViews } from "./redemption-assignment-view.js";
import { newRedemptionAssignment } from "./redemption-assignment.js";

test("RedemptionAssignmentView shows the status in capitals", () => {
  const item = newRedemptionAssignment("code-274", "name-112");
  const view = toRedemptionAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRedemptionAssignmentViews([item, item]).length, 2, "views");
});
