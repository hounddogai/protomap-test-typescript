import assert from "node:assert/strict";
import { test } from "node:test";
import { toPlacementMetricView, toPlacementMetricViews } from "./placement-metric-view.js";
import { newPlacementMetric } from "./placement-metric.js";

test("PlacementMetricView shows the status in capitals", () => {
  const item = newPlacementMetric("code-220", "name-840");
  const view = toPlacementMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPlacementMetricViews([item, item]).length, 2, "views");
});
