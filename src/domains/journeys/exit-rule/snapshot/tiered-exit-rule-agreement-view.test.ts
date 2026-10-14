import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredExitRuleAgreementView, toTieredExitRuleAgreementViews } from "./tiered-exit-rule-agreement-view.js";
import { newTieredExitRuleAgreement } from "./tiered-exit-rule-agreement.js";

test("TieredExitRuleAgreementView shows the status in capitals", () => {
  const item = newTieredExitRuleAgreement("code-309", "name-275");
  const view = toTieredExitRuleAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredExitRuleAgreementViews([item, item]).length, 2, "views");
});
