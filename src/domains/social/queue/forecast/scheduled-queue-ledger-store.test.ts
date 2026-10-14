import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledQueueLedgerStore } from "./scheduled-queue-ledger-store.js";
import { newScheduledQueueLedger } from "./scheduled-queue-ledger.js";

test("MemoryScheduledQueueLedgerStore finds what it saved", () => {
  const store = newMemoryScheduledQueueLedgerStore();
  const item = newScheduledQueueLedger("code-111", "name-427");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
