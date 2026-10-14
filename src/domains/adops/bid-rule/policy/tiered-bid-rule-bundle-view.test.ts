import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredBidRuleBundleView, toTieredBidRuleBundleViews } from "./tiered-bid-rule-bundle-view.js";
import { newTieredBidRuleBundle } from "./tiered-bid-rule-bundle.js";

test("TieredBidRuleBundleView shows the status in capitals", () => {
  const item = newTieredBidRuleBundle("code-154", "name-960");
  const view = toTieredBidRuleBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredBidRuleBundleViews([item, item]).length, 2, "views");
});
