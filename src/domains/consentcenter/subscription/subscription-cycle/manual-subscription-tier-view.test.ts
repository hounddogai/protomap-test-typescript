import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualSubscriptionTierView, toManualSubscriptionTierViews } from "./manual-subscription-tier-view.js";
import { newManualSubscriptionTier } from "./manual-subscription-tier.js";

test("ManualSubscriptionTierView shows the status in capitals", () => {
  const item = newManualSubscriptionTier("code-294", "label-202");
  const view = toManualSubscriptionTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualSubscriptionTierViews([item, item]).length, 2, "views");
});
