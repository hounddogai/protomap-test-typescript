import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toCappedRedemptionAgreementView,
  toCappedRedemptionAgreementViews,
} from "./capped-redemption-agreement-view.js";
import { newCappedRedemptionAgreement } from "./capped-redemption-agreement.js";

test("CappedRedemptionAgreementView shows the status in capitals", () => {
  const item = newCappedRedemptionAgreement("code-326", "label-867");
  const view = toCappedRedemptionAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedRedemptionAgreementViews([item, item]).length, 2, "views");
});
