import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingPayoutBatchStore } from "./rolling-payout-batch-store.js";
import { newRollingPayoutBatch } from "./rolling-payout-batch.js";

test("MemoryRollingPayoutBatchStore finds what it saved", () => {
  const store = newMemoryRollingPayoutBatchStore();
  const item = newRollingPayoutBatch("code-239", "name-896");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
