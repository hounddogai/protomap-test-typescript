import assert from "node:assert/strict";
import { test } from "node:test";
import { toPayoutTierView, toPayoutTierViews } from "./payout-tier-view.js";
import { newPayoutTier } from "./payout-tier.js";

test("PayoutTierView shows the status in capitals", () => {
  const item = newPayoutTier("code-26", "label-221");
  const view = toPayoutTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPayoutTierViews([item, item]).length, 2, "views");
});
