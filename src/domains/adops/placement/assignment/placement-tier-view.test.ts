import assert from "node:assert/strict";
import { test } from "node:test";
import { toPlacementTierView, toPlacementTierViews } from "./placement-tier-view.js";
import { newPlacementTier } from "./placement-tier.js";

test("PlacementTierView shows the status in capitals", () => {
  const item = newPlacementTier("code-266", "name-922");
  const view = toPlacementTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPlacementTierViews([item, item]).length, 2, "views");
});
