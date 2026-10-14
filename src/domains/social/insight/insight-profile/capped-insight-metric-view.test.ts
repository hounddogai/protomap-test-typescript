import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedInsightMetricView, toCappedInsightMetricViews } from "./capped-insight-metric-view.js";
import { newCappedInsightMetric } from "./capped-insight-metric.js";

test("CappedInsightMetricView shows the status in capitals", () => {
  const item = newCappedInsightMetric("code-187", "label-856");
  const view = toCappedInsightMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedInsightMetricViews([item, item]).length, 2, "views");
});
