import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackPayoutAgreementView, toFallbackPayoutAgreementViews } from "./fallback-payout-agreement-view.js";
import { newFallbackPayoutAgreement } from "./fallback-payout-agreement.js";

test("FallbackPayoutAgreementView shows the status in capitals", () => {
  const item = newFallbackPayoutAgreement("code-865", "label-953");
  const view = toFallbackPayoutAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackPayoutAgreementViews([item, item]).length, 2, "views");
});
