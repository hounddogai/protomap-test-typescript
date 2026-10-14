import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredBidRuleEstimateView, toTieredBidRuleEstimateViews } from "./tiered-bid-rule-estimate-view.js";
import { newTieredBidRuleEstimate } from "./tiered-bid-rule-estimate.js";

test("TieredBidRuleEstimateView shows the status in capitals", () => {
  const item = newTieredBidRuleEstimate("code-790", "title-863");
  const view = toTieredBidRuleEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredBidRuleEstimateViews([item, item]).length, 2, "views");
});
