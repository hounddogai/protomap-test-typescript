import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalActivationTierView, toSeasonalActivationTierViews } from "./seasonal-activation-tier-view.js";
import { newSeasonalActivationTier } from "./seasonal-activation-tier.js";

test("SeasonalActivationTierView shows the status in capitals", () => {
  const item = newSeasonalActivationTier("code-152", "name-151");
  const view = toSeasonalActivationTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalActivationTierViews([item, item]).length, 2, "views");
});
