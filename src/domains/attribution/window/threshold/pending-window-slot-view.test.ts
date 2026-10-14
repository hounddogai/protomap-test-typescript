import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingWindowSlotView, toPendingWindowSlotViews } from "./pending-window-slot-view.js";
import { newPendingWindowSlot } from "./pending-window-slot.js";

test("PendingWindowSlotView shows the status in capitals", () => {
  const item = newPendingWindowSlot("code-625", "name-631");
  const view = toPendingWindowSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingWindowSlotViews([item, item]).length, 2, "views");
});
