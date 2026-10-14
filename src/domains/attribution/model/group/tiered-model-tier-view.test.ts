import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredModelTierView, toTieredModelTierViews } from "./tiered-model-tier-view.js";
import { newTieredModelTier } from "./tiered-model-tier.js";

test("TieredModelTierView shows the status in capitals", () => {
  const item = newTieredModelTier("code-53", "name-235");
  const view = toTieredModelTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredModelTierViews([item, item]).length, 2, "views");
});
