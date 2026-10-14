import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackTicketViewSlotView, toFallbackTicketViewSlotViews } from "./fallback-ticket-view-slot-view.js";
import { newFallbackTicketViewSlot } from "./fallback-ticket-view-slot.js";

test("FallbackTicketViewSlotView shows the status in capitals", () => {
  const item = newFallbackTicketViewSlot("code-510", "name-631");
  const view = toFallbackTicketViewSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackTicketViewSlotViews([item, item]).length, 2, "views");
});
