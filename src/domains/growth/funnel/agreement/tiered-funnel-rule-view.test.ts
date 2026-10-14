import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredFunnelRuleView, toTieredFunnelRuleViews } from "./tiered-funnel-rule-view.js";
import { newTieredFunnelRule } from "./tiered-funnel-rule.js";

test("TieredFunnelRuleView shows the status in capitals", () => {
  const item = newTieredFunnelRule("code-701", "title-353");
  const view = toTieredFunnelRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredFunnelRuleViews([item, item]).length, 2, "views");
});
