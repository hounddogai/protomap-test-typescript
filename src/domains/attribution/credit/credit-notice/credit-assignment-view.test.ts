import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreditAssignmentView, toCreditAssignmentViews } from "./credit-assignment-view.js";
import { newCreditAssignment } from "./credit-assignment.js";

test("CreditAssignmentView shows the status in capitals", () => {
  const item = newCreditAssignment("code-247", "title-600");
  const view = toCreditAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreditAssignmentViews([item, item]).length, 2, "views");
});
