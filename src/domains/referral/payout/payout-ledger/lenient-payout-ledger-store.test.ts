import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientPayoutLedgerStore } from "./lenient-payout-ledger-store.js";
import { newLenientPayoutLedger } from "./lenient-payout-ledger.js";

test("MemoryLenientPayoutLedgerStore finds what it saved", () => {
  const store = newMemoryLenientPayoutLedgerStore();
  const item = newLenientPayoutLedger("code-532", "title-665");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
