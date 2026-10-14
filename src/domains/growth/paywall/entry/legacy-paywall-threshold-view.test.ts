import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyPaywallThresholdView, toLegacyPaywallThresholdViews } from "./legacy-paywall-threshold-view.js";
import { newLegacyPaywallThreshold } from "./legacy-paywall-threshold.js";

test("LegacyPaywallThresholdView shows the status in capitals", () => {
  const item = newLegacyPaywallThreshold("code-360", "name-211");
  const view = toLegacyPaywallThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyPaywallThresholdViews([item, item]).length, 2, "views");
});
