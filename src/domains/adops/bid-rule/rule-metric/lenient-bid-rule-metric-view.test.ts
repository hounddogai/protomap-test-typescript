import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientBidRuleMetricView, toLenientBidRuleMetricViews } from "./lenient-bid-rule-metric-view.js";
import { newLenientBidRuleMetric } from "./lenient-bid-rule-metric.js";

test("LenientBidRuleMetricView shows the status in capitals", () => {
  const item = newLenientBidRuleMetric("code-678", "name-417");
  const view = toLenientBidRuleMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientBidRuleMetricViews([item, item]).length, 2, "views");
});
