import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyTicketViewSlotView, toLegacyTicketViewSlotViews } from "./legacy-ticket-view-slot-view.js";
import { newLegacyTicketViewSlot } from "./legacy-ticket-view-slot.js";

test("LegacyTicketViewSlotView shows the status in capitals", () => {
  const item = newLegacyTicketViewSlot("code-945", "name-133");
  const view = toLegacyTicketViewSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyTicketViewSlotViews([item, item]).length, 2, "views");
});
