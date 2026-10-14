import assert from "node:assert/strict";
import { test } from "node:test";
import { toPayoutAdjustmentView, toPayoutAdjustmentViews } from "./payout-adjustment-view.js";
import { newPayoutAdjustment } from "./payout-adjustment.js";

test("PayoutAdjustmentView shows the status in capitals", () => {
  const item = newPayoutAdjustment("code-923", "name-954");
  const view = toPayoutAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPayoutAdjustmentViews([item, item]).length, 2, "views");
});
