import assert from "node:assert/strict";
import { test } from "node:test";
import { toSubscriptionTierView, toSubscriptionTierViews } from "./subscription-tier-view.js";
import { newSubscriptionTier } from "./subscription-tier.js";

test("SubscriptionTierView shows the status in capitals", () => {
  const item = newSubscriptionTier("code-913", "label-534");
  const view = toSubscriptionTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSubscriptionTierViews([item, item]).length, 2, "views");
});
