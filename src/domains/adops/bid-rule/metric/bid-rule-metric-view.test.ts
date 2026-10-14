import assert from "node:assert/strict";
import { test } from "node:test";
import { toBidRuleMetricView, toBidRuleMetricViews } from "./bid-rule-metric-view.js";
import { newBidRuleMetric } from "./bid-rule-metric.js";

test("BidRuleMetricView shows the status in capitals", () => {
  const item = newBidRuleMetric("code-43", "name-308");
  const view = toBidRuleMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBidRuleMetricViews([item, item]).length, 2, "views");
});
