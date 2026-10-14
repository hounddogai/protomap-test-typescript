import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingFlightMetricView, toRollingFlightMetricViews } from "./rolling-flight-metric-view.js";
import { newRollingFlightMetric } from "./rolling-flight-metric.js";

test("RollingFlightMetricView shows the status in capitals", () => {
  const item = newRollingFlightMetric("code-12", "label-381");
  const view = toRollingFlightMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingFlightMetricViews([item, item]).length, 2, "views");
});
