import assert from "node:assert/strict";
import { test } from "node:test";
import { toOptOutMetricView, toOptOutMetricViews } from "./opt-out-metric-view.js";
import { newOptOutMetric } from "./opt-out-metric.js";

test("OptOutMetricView shows the status in capitals", () => {
  const item = newOptOutMetric("code-893", "label-903");
  const view = toOptOutMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toOptOutMetricViews([item, item]).length, 2, "views");
});
