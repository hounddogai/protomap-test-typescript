import assert from "node:assert/strict";
import { test } from "node:test";
import { toApprovalPolicyView, toApprovalPolicyViews } from "./approval-policy-view.js";
import { newApprovalPolicy } from "./approval-policy.js";

test("ApprovalPolicyView shows the status in capitals", () => {
  const item = newApprovalPolicy("code-637", "name-77");
  const view = toApprovalPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toApprovalPolicyViews([item, item]).length, 2, "views");
});
