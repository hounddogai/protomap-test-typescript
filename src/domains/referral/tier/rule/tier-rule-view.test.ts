import assert from "node:assert/strict";
import { test } from "node:test";
import { toTierRuleView, toTierRuleViews } from "./tier-rule-view.js";
import { newTierRule } from "./tier-rule.js";

test("TierRuleView shows the status in capitals", () => {
  const item = newTierRule("code-50", "label-535");
  const view = toTierRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTierRuleViews([item, item]).length, 2, "views");
});
