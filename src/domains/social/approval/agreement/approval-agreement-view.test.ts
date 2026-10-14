import assert from "node:assert/strict";
import { test } from "node:test";
import { toApprovalAgreementView, toApprovalAgreementViews } from "./approval-agreement-view.js";
import { newApprovalAgreement } from "./approval-agreement.js";

test("ApprovalAgreementView shows the status in capitals", () => {
  const item = newApprovalAgreement("code-551", "name-347");
  const view = toApprovalAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toApprovalAgreementViews([item, item]).length, 2, "views");
});
