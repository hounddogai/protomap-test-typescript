import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientRedemptionTierView, toLenientRedemptionTierViews } from "./lenient-redemption-tier-view.js";
import { newLenientRedemptionTier } from "./lenient-redemption-tier.js";

test("LenientRedemptionTierView shows the status in capitals", () => {
  const item = newLenientRedemptionTier("code-490", "name-634");
  const view = toLenientRedemptionTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientRedemptionTierViews([item, item]).length, 2, "views");
});
