import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictBidRuleAgreementView, toStrictBidRuleAgreementViews } from "./strict-bid-rule-agreement-view.js";
import { newStrictBidRuleAgreement } from "./strict-bid-rule-agreement.js";

test("StrictBidRuleAgreementView shows the status in capitals", () => {
  const item = newStrictBidRuleAgreement("code-960", "label-476");
  const view = toStrictBidRuleAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictBidRuleAgreementViews([item, item]).length, 2, "views");
});
