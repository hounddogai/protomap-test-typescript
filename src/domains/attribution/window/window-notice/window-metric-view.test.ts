import assert from "node:assert/strict";
import { test } from "node:test";
import { toWindowMetricView, toWindowMetricViews } from "./window-metric-view.js";
import { newWindowMetric } from "./window-metric.js";

test("WindowMetricView shows the status in capitals", () => {
  const item = newWindowMetric("code-862", "name-433");
  const view = toWindowMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWindowMetricViews([item, item]).length, 2, "views");
});
