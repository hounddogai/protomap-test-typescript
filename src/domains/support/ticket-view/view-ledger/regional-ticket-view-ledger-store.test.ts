import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalTicketViewLedgerStore } from "./regional-ticket-view-ledger-store.js";
import { newRegionalTicketViewLedger } from "./regional-ticket-view-ledger.js";

test("MemoryRegionalTicketViewLedgerStore finds what it saved", () => {
  const store = newMemoryRegionalTicketViewLedgerStore();
  const item = newRegionalTicketViewLedger("code-187", "label-814");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
