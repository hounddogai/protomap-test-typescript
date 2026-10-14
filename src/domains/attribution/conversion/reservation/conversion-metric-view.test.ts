import assert from "node:assert/strict";
import { test } from "node:test";
import { toConversionMetricView, toConversionMetricViews } from "./conversion-metric-view.js";
import { newConversionMetric } from "./conversion-metric.js";

test("ConversionMetricView shows the status in capitals", () => {
  const item = newConversionMetric("code-761", "label-161");
  const view = toConversionMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toConversionMetricViews([item, item]).length, 2, "views");
});
