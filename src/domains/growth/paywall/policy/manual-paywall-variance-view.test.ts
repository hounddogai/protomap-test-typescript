import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualPaywallVarianceView, toManualPaywallVarianceViews } from "./manual-paywall-variance-view.js";
import { newManualPaywallVariance } from "./manual-paywall-variance.js";

test("ManualPaywallVarianceView shows the status in capitals", () => {
  const item = newManualPaywallVariance("code-601", "label-285");
  const view = toManualPaywallVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualPaywallVarianceViews([item, item]).length, 2, "views");
});
