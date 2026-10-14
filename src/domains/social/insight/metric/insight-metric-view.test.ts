import assert from "node:assert/strict";
import { test } from "node:test";
import { toInsightMetricView, toInsightMetricViews } from "./insight-metric-view.js";
import { newInsightMetric } from "./insight-metric.js";

test("InsightMetricView shows the status in capitals", () => {
  const item = newInsightMetric("code-436", "name-202");
  const view = toInsightMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInsightMetricViews([item, item]).length, 2, "views");
});
