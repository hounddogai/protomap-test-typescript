import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toGlobalPlacementAdjustmentView,
  toGlobalPlacementAdjustmentViews,
} from "./global-placement-adjustment-view.js";
import { newGlobalPlacementAdjustment } from "./global-placement-adjustment.js";

test("GlobalPlacementAdjustmentView shows the status in capitals", () => {
  const item = newGlobalPlacementAdjustment("code-499", "title-68");
  const view = toGlobalPlacementAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalPlacementAdjustmentViews([item, item]).length, 2, "views");
});
