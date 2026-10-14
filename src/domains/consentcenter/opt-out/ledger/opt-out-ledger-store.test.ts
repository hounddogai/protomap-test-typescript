import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryOptOutLedgerStore } from "./opt-out-ledger-store.js";
import { newOptOutLedger } from "./opt-out-ledger.js";

test("MemoryOptOutLedgerStore finds what it saved", () => {
  const store = newMemoryOptOutLedgerStore();
  const item = newOptOutLedger("code-656", "name-769");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
