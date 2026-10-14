import assert from "node:assert/strict";
import { test } from "node:test";
import { toTicketViewSlotView, toTicketViewSlotViews } from "./ticket-view-slot-view.js";
import { newTicketViewSlot } from "./ticket-view-slot.js";

test("TicketViewSlotView shows the status in capitals", () => {
  const item = newTicketViewSlot("code-319", "title-75");
  const view = toTicketViewSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTicketViewSlotViews([item, item]).length, 2, "views");
});
