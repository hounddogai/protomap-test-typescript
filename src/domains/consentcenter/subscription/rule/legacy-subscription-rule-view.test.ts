import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacySubscriptionRuleView, toLegacySubscriptionRuleViews } from "./legacy-subscription-rule-view.js";
import { newLegacySubscriptionRule } from "./legacy-subscription-rule.js";

test("LegacySubscriptionRuleView shows the status in capitals", () => {
  const item = newLegacySubscriptionRule("code-791", "title-147");
  const view = toLegacySubscriptionRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacySubscriptionRuleViews([item, item]).length, 2, "views");
});
