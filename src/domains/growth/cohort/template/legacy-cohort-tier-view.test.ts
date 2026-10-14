import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyCohortTierView, toLegacyCohortTierViews } from "./legacy-cohort-tier-view.js";
import { newLegacyCohortTier } from "./legacy-cohort-tier.js";

test("LegacyCohortTierView shows the status in capitals", () => {
  const item = newLegacyCohortTier("code-548", "label-800");
  const view = toLegacyCohortTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyCohortTierViews([item, item]).length, 2, "views");
});
