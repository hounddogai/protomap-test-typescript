import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredDeflectionTierView, toTieredDeflectionTierViews } from "./tiered-deflection-tier-view.js";
import { newTieredDeflectionTier } from "./tiered-deflection-tier.js";

test("TieredDeflectionTierView shows the status in capitals", () => {
  const item = newTieredDeflectionTier("code-477", "label-93");
  const view = toTieredDeflectionTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredDeflectionTierViews([item, item]).length, 2, "views");
});
