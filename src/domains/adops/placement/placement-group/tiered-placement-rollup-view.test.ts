import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredPlacementRollupView, toTieredPlacementRollupViews } from "./tiered-placement-rollup-view.js";
import { newTieredPlacementRollup } from "./tiered-placement-rollup.js";

test("TieredPlacementRollupView shows the status in capitals", () => {
  const item = newTieredPlacementRollup("code-376", "name-689");
  const view = toTieredPlacementRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredPlacementRollupViews([item, item]).length, 2, "views");
});
