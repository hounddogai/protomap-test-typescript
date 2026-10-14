import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedWarmupLedgerStore } from "./batched-warmup-ledger-store.js";
import { newBatchedWarmupLedger } from "./batched-warmup-ledger.js";

test("MemoryBatchedWarmupLedgerStore finds what it saved", () => {
  const store = newMemoryBatchedWarmupLedgerStore();
  const item = newBatchedWarmupLedger("code-984", "title-268");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
