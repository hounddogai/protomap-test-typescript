import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryPlacementRollupView, toPrimaryPlacementRollupViews } from "./primary-placement-rollup-view.js";
import { newPrimaryPlacementRollup } from "./primary-placement-rollup.js";

test("PrimaryPlacementRollupView shows the status in capitals", () => {
  const item = newPrimaryPlacementRollup("code-286", "name-139");
  const view = toPrimaryPlacementRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryPlacementRollupViews([item, item]).length, 2, "views");
});
