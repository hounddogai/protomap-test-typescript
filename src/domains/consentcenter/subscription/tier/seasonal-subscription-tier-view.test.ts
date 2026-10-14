import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalSubscriptionTierView,
  toSeasonalSubscriptionTierViews,
} from "./seasonal-subscription-tier-view.js";
import { newSeasonalSubscriptionTier } from "./seasonal-subscription-tier.js";

test("SeasonalSubscriptionTierView shows the status in capitals", () => {
  const item = newSeasonalSubscriptionTier("code-759", "title-437");
  const view = toSeasonalSubscriptionTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalSubscriptionTierViews([item, item]).length, 2, "views");
});
