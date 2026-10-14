import assert from "node:assert/strict";
import { test } from "node:test";
import { toPaywallMetricView, toPaywallMetricViews } from "./paywall-metric-view.js";
import { newPaywallMetric } from "./paywall-metric.js";

test("PaywallMetricView shows the status in capitals", () => {
  const item = newPaywallMetric("code-104", "label-550");
  const view = toPaywallMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPaywallMetricViews([item, item]).length, 2, "views");
});
