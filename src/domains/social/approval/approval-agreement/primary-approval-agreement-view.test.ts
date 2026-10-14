import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPrimaryApprovalAgreementView,
  toPrimaryApprovalAgreementViews,
} from "./primary-approval-agreement-view.js";
import { newPrimaryApprovalAgreement } from "./primary-approval-agreement.js";

test("PrimaryApprovalAgreementView shows the status in capitals", () => {
  const item = newPrimaryApprovalAgreement("code-553", "name-932");
  const view = toPrimaryApprovalAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryApprovalAgreementViews([item, item]).length, 2, "views");
});
