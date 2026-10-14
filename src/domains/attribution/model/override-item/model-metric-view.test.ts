import assert from "node:assert/strict";
import { test } from "node:test";
import { toModelMetricView, toModelMetricViews } from "./model-metric-view.js";
import { newModelMetric } from "./model-metric.js";

test("ModelMetricView shows the status in capitals", () => {
  const item = newModelMetric("code-830", "label-20");
  const view = toModelMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toModelMetricViews([item, item]).length, 2, "views");
});
