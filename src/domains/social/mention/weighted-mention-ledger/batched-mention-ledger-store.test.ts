import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedMentionLedgerStore } from "./batched-mention-ledger-store.js";
import { newBatchedMentionLedger } from "./batched-mention-ledger.js";

test("MemoryBatchedMentionLedgerStore finds what it saved", () => {
  const store = newMemoryBatchedMentionLedgerStore();
  const item = newBatchedMentionLedger("code-398", "label-877");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
