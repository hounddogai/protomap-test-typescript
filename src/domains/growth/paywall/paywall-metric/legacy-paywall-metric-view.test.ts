import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyPaywallMetricView, toLegacyPaywallMetricViews } from "./legacy-paywall-metric-view.js";
import { newLegacyPaywallMetric } from "./legacy-paywall-metric.js";

test("LegacyPaywallMetricView shows the status in capitals", () => {
  const item = newLegacyPaywallMetric("code-110", "title-392");
  const view = toLegacyPaywallMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyPaywallMetricViews([item, item]).length, 2, "views");
});
