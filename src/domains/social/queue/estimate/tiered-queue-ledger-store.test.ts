import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredQueueLedgerStore } from "./tiered-queue-ledger-store.js";
import { newTieredQueueLedger } from "./tiered-queue-ledger.js";

test("MemoryTieredQueueLedgerStore finds what it saved", () => {
  const store = newMemoryTieredQueueLedgerStore();
  const item = newTieredQueueLedger("code-898", "title-881");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
