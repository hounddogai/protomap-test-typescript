import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toDefaultPlacementAdjustmentView,
  toDefaultPlacementAdjustmentViews,
} from "./default-placement-adjustment-view.js";
import { newDefaultPlacementAdjustment } from "./default-placement-adjustment.js";

test("DefaultPlacementAdjustmentView shows the status in capitals", () => {
  const item = newDefaultPlacementAdjustment("code-655", "label-587");
  const view = toDefaultPlacementAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultPlacementAdjustmentViews([item, item]).length, 2, "views");
});
