import assert from "node:assert/strict";
import { test } from "node:test";
import { toPaywallClaimView, toPaywallClaimViews } from "./paywall-claim-view.js";
import { newPaywallClaim } from "./paywall-claim.js";

test("PaywallClaimView shows the status in capitals", () => {
  const item = newPaywallClaim("code-540", "title-618");
  const view = toPaywallClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPaywallClaimViews([item, item]).length, 2, "views");
});
