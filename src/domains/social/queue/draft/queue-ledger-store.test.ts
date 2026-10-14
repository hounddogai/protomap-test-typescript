import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryQueueLedgerStore } from "./queue-ledger-store.js";
import { newQueueLedger } from "./queue-ledger.js";

test("MemoryQueueLedgerStore finds what it saved", () => {
  const store = newMemoryQueueLedgerStore();
  const item = newQueueLedger("code-236", "title-843");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
