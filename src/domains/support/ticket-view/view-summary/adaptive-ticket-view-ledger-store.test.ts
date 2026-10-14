import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveTicketViewLedgerStore } from "./adaptive-ticket-view-ledger-store.js";
import { newAdaptiveTicketViewLedger } from "./adaptive-ticket-view-ledger.js";

test("MemoryAdaptiveTicketViewLedgerStore finds what it saved", () => {
  const store = newMemoryAdaptiveTicketViewLedgerStore();
  const item = newAdaptiveTicketViewLedger("code-30", "label-59");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
