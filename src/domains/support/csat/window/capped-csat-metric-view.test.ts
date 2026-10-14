import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedCsatMetricView, toCappedCsatMetricViews } from "./capped-csat-metric-view.js";
import { newCappedCsatMetric } from "./capped-csat-metric.js";

test("CappedCsatMetricView shows the status in capitals", () => {
  const item = newCappedCsatMetric("code-150", "name-426");
  const view = toCappedCsatMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedCsatMetricViews([item, item]).length, 2, "views");
});
