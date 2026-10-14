import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredBadgeAdjustmentView, toTieredBadgeAdjustmentViews } from "./tiered-badge-adjustment-view.js";
import { newTieredBadgeAdjustment } from "./tiered-badge-adjustment.js";

test("TieredBadgeAdjustmentView shows the status in capitals", () => {
  const item = newTieredBadgeAdjustment("code-356", "name-879");
  const view = toTieredBadgeAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredBadgeAdjustmentViews([item, item]).length, 2, "views");
});
