import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedActivationMetricView, toCappedActivationMetricViews } from "./capped-activation-metric-view.js";
import { newCappedActivationMetric } from "./capped-activation-metric.js";

test("CappedActivationMetricView shows the status in capitals", () => {
  const item = newCappedActivationMetric("code-22", "name-191");
  const view = toCappedActivationMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedActivationMetricViews([item, item]).length, 2, "views");
});
