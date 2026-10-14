import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackPathMetricView, toFallbackPathMetricViews } from "./fallback-path-metric-view.js";
import { newFallbackPathMetric } from "./fallback-path-metric.js";

test("FallbackPathMetricView shows the status in capitals", () => {
  const item = newFallbackPathMetric("code-443", "label-453");
  const view = toFallbackPathMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackPathMetricViews([item, item]).length, 2, "views");
});
