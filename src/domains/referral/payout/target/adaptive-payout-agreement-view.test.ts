import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptivePayoutAgreementView, toAdaptivePayoutAgreementViews } from "./adaptive-payout-agreement-view.js";
import { newAdaptivePayoutAgreement } from "./adaptive-payout-agreement.js";

test("AdaptivePayoutAgreementView shows the status in capitals", () => {
  const item = newAdaptivePayoutAgreement("code-463", "title-551");
  const view = toAdaptivePayoutAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptivePayoutAgreementViews([item, item]).length, 2, "views");
});
