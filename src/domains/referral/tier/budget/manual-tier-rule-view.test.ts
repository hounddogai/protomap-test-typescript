import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualTierRuleView, toManualTierRuleViews } from "./manual-tier-rule-view.js";
import { newManualTierRule } from "./manual-tier-rule.js";

test("ManualTierRuleView shows the status in capitals", () => {
  const item = newManualTierRule("code-680", "label-732");
  const view = toManualTierRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualTierRuleViews([item, item]).length, 2, "views");
});
