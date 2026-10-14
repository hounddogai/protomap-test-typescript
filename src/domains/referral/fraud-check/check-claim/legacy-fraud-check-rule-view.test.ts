import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyFraudCheckRuleView, toLegacyFraudCheckRuleViews } from "./legacy-fraud-check-rule-view.js";
import { newLegacyFraudCheckRule } from "./legacy-fraud-check-rule.js";

test("LegacyFraudCheckRuleView shows the status in capitals", () => {
  const item = newLegacyFraudCheckRule("code-511", "title-556");
  const view = toLegacyFraudCheckRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyFraudCheckRuleViews([item, item]).length, 2, "views");
});
