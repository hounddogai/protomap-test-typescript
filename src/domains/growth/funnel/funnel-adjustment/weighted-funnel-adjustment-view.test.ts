import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedFunnelAdjustmentView,
  toWeightedFunnelAdjustmentViews,
} from "./weighted-funnel-adjustment-view.js";
import { newWeightedFunnelAdjustment } from "./weighted-funnel-adjustment.js";

test("WeightedFunnelAdjustmentView shows the status in capitals", () => {
  const item = newWeightedFunnelAdjustment("code-303", "label-903");
  const view = toWeightedFunnelAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedFunnelAdjustmentViews([item, item]).length, 2, "views");
});
