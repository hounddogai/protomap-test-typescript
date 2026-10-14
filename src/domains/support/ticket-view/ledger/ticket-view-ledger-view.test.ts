import assert from "node:assert/strict";
import { test } from "node:test";
import { toTicketViewLedgerView, toTicketViewLedgerViews } from "./ticket-view-ledger-view.js";
import { newTicketViewLedger } from "./ticket-view-ledger.js";

test("TicketViewLedgerView shows the status in capitals", () => {
  const item = newTicketViewLedger("code-987", "name-334");
  const view = toTicketViewLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTicketViewLedgerViews([item, item]).length, 2, "views");
});
