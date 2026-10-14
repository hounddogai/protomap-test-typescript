import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptiveApprovalAgreementView,
  toAdaptiveApprovalAgreementViews,
} from "./adaptive-approval-agreement-view.js";
import { newAdaptiveApprovalAgreement } from "./adaptive-approval-agreement.js";

test("AdaptiveApprovalAgreementView shows the status in capitals", () => {
  const item = newAdaptiveApprovalAgreement("code-508", "label-683");
  const view = toAdaptiveApprovalAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveApprovalAgreementViews([item, item]).length, 2, "views");
});
