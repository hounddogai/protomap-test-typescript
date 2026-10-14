import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientConversionMetricView, toLenientConversionMetricViews } from "./lenient-conversion-metric-view.js";
import { newLenientConversionMetric } from "./lenient-conversion-metric.js";

test("LenientConversionMetricView shows the status in capitals", () => {
  const item = newLenientConversionMetric("code-521", "name-193");
  const view = toLenientConversionMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientConversionMetricViews([item, item]).length, 2, "views");
});
