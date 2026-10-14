import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedPayoutBatchStore } from "./batched-payout-batch-store.js";
import { newBatchedPayoutBatch } from "./batched-payout-batch.js";

test("MemoryBatchedPayoutBatchStore finds what it saved", () => {
  const store = newMemoryBatchedPayoutBatchStore();
  const item = newBatchedPayoutBatch("code-856", "name-933");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
