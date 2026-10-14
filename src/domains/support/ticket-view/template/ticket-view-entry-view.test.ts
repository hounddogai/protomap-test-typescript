import assert from "node:assert/strict";
import { test } from "node:test";
import { toTicketViewEntryView, toTicketViewEntryViews } from "./ticket-view-entry-view.js";
import { newTicketViewEntry } from "./ticket-view-entry.js";

test("TicketViewEntryView shows the status in capitals", () => {
  const item = newTicketViewEntry("code-74", "title-421");
  const view = toTicketViewEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTicketViewEntryViews([item, item]).length, 2, "views");
});
