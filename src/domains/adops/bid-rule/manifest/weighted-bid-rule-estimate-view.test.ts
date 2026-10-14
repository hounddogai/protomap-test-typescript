import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedBidRuleEstimateView, toWeightedBidRuleEstimateViews } from "./weighted-bid-rule-estimate-view.js";
import { newWeightedBidRuleEstimate } from "./weighted-bid-rule-estimate.js";

test("WeightedBidRuleEstimateView shows the status in capitals", () => {
  const item = newWeightedBidRuleEstimate("code-793", "label-69");
  const view = toWeightedBidRuleEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedBidRuleEstimateViews([item, item]).length, 2, "views");
});
