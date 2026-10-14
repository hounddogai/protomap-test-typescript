import assert from "node:assert/strict";
import { test } from "node:test";
import { toFunnelAdjustmentView, toFunnelAdjustmentViews } from "./funnel-adjustment-view.js";
import { newFunnelAdjustment } from "./funnel-adjustment.js";

test("FunnelAdjustmentView shows the status in capitals", () => {
  const item = newFunnelAdjustment("code-536", "name-476");
  const view = toFunnelAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFunnelAdjustmentViews([item, item]).length, 2, "views");
});
