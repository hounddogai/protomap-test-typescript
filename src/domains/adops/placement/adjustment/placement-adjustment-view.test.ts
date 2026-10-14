import assert from "node:assert/strict";
import { test } from "node:test";
import { toPlacementAdjustmentView, toPlacementAdjustmentViews } from "./placement-adjustment-view.js";
import { newPlacementAdjustment } from "./placement-adjustment.js";

test("PlacementAdjustmentView shows the status in capitals", () => {
  const item = newPlacementAdjustment("code-852", "label-552");
  const view = toPlacementAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPlacementAdjustmentViews([item, item]).length, 2, "views");
});
