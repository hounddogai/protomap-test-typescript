import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingFunnelAdjustmentView, toPendingFunnelAdjustmentViews } from "./pending-funnel-adjustment-view.js";
import { newPendingFunnelAdjustment } from "./pending-funnel-adjustment.js";

test("PendingFunnelAdjustmentView shows the status in capitals", () => {
  const item = newPendingFunnelAdjustment("code-78", "title-86");
  const view = toPendingFunnelAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingFunnelAdjustmentViews([item, item]).length, 2, "views");
});
