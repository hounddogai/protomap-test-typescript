import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackFlightMetricView, toFallbackFlightMetricViews } from "./fallback-flight-metric-view.js";
import { newFallbackFlightMetric } from "./fallback-flight-metric.js";

test("FallbackFlightMetricView shows the status in capitals", () => {
  const item = newFallbackFlightMetric("code-286", "label-296");
  const view = toFallbackFlightMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackFlightMetricViews([item, item]).length, 2, "views");
});
