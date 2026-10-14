import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingEnrollmentPolicyView, toPendingEnrollmentPolicyViews } from "./pending-enrollment-policy-view.js";
import { newPendingEnrollmentPolicy } from "./pending-enrollment-policy.js";

test("PendingEnrollmentPolicyView shows the status in capitals", () => {
  const item = newPendingEnrollmentPolicy("code-682", "title-475");
  const view = toPendingEnrollmentPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingEnrollmentPolicyViews([item, item]).length, 2, "views");
});
