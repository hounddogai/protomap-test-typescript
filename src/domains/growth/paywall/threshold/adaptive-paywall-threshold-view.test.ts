import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptivePaywallThresholdView,
  toAdaptivePaywallThresholdViews,
} from "./adaptive-paywall-threshold-view.js";
import { newAdaptivePaywallThreshold } from "./adaptive-paywall-threshold.js";

test("AdaptivePaywallThresholdView shows the status in capitals", () => {
  const item = newAdaptivePaywallThreshold("code-737", "name-117");
  const view = toAdaptivePaywallThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptivePaywallThresholdViews([item, item]).length, 2, "views");
});
