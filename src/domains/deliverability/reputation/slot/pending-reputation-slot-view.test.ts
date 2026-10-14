import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingReputationSlotView, toPendingReputationSlotViews } from "./pending-reputation-slot-view.js";
import { newPendingReputationSlot } from "./pending-reputation-slot.js";

test("PendingReputationSlotView shows the status in capitals", () => {
  const item = newPendingReputationSlot("code-591", "label-842");
  const view = toPendingReputationSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingReputationSlotViews([item, item]).length, 2, "views");
});
