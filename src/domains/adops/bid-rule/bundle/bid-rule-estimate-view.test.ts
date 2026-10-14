import assert from "node:assert/strict";
import { test } from "node:test";
import { toBidRuleEstimateView, toBidRuleEstimateViews } from "./bid-rule-estimate-view.js";
import { newBidRuleEstimate } from "./bid-rule-estimate.js";

test("BidRuleEstimateView shows the status in capitals", () => {
  const item = newBidRuleEstimate("code-568", "name-461");
  const view = toBidRuleEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBidRuleEstimateViews([item, item]).length, 2, "views");
});
