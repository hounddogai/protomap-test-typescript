import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedPaywallMetricView, toCappedPaywallMetricViews } from "./capped-paywall-metric-view.js";
import { newCappedPaywallMetric } from "./capped-paywall-metric.js";

test("CappedPaywallMetricView shows the status in capitals", () => {
  const item = newCappedPaywallMetric("code-825", "title-434");
  const view = toCappedPaywallMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedPaywallMetricViews([item, item]).length, 2, "views");
});
