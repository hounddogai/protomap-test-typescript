import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledDeflectionMetricView,
  toScheduledDeflectionMetricViews,
} from "./scheduled-deflection-metric-view.js";
import { newScheduledDeflectionMetric } from "./scheduled-deflection-metric.js";

test("ScheduledDeflectionMetricView shows the status in capitals", () => {
  const item = newScheduledDeflectionMetric("code-601", "label-863");
  const view = toScheduledDeflectionMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledDeflectionMetricViews([item, item]).length, 2, "views");
});
