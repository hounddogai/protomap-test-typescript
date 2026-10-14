import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientWindowMetricView, toLenientWindowMetricViews } from "./lenient-window-metric-view.js";
import { newLenientWindowMetric } from "./lenient-window-metric.js";

test("LenientWindowMetricView shows the status in capitals", () => {
  const item = newLenientWindowMetric("code-892", "label-425");
  const view = toLenientWindowMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientWindowMetricViews([item, item]).length, 2, "views");
});
