import assert from "node:assert/strict";
import { test } from "node:test";
import { toBidRuleAgreementView, toBidRuleAgreementViews } from "./bid-rule-agreement-view.js";
import { newBidRuleAgreement } from "./bid-rule-agreement.js";

test("BidRuleAgreementView shows the status in capitals", () => {
  const item = newBidRuleAgreement("code-689", "label-737");
  const view = toBidRuleAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBidRuleAgreementViews([item, item]).length, 2, "views");
});
