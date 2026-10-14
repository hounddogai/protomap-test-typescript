import assert from "node:assert/strict";
import { test } from "node:test";
import { toPayoutSlotView, toPayoutSlotViews } from "./payout-slot-view.js";
import { newPayoutSlot } from "./payout-slot.js";

test("PayoutSlotView shows the status in capitals", () => {
  const item = newPayoutSlot("code-555", "label-452");
  const view = toPayoutSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPayoutSlotViews([item, item]).length, 2, "views");
});
