import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualPaywallClaimView, toManualPaywallClaimViews } from "./manual-paywall-claim-view.js";
import { newManualPaywallClaim } from "./manual-paywall-claim.js";

test("ManualPaywallClaimView shows the status in capitals", () => {
  const item = newManualPaywallClaim("code-594", "label-746");
  const view = toManualPaywallClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualPaywallClaimViews([item, item]).length, 2, "views");
});
