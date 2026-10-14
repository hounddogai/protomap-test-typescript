import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalSuppressionTierView, toSeasonalSuppressionTierViews } from "./seasonal-suppression-tier-view.js";
import { newSeasonalSuppressionTier } from "./seasonal-suppression-tier.js";

test("SeasonalSuppressionTierView shows the status in capitals", () => {
  const item = newSeasonalSuppressionTier("code-356", "title-903");
  const view = toSeasonalSuppressionTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalSuppressionTierViews([item, item]).length, 2, "views");
});
