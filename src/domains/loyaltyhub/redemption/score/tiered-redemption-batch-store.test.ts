import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredRedemptionBatchStore } from "./tiered-redemption-batch-store.js";
import { newTieredRedemptionBatch } from "./tiered-redemption-batch.js";

test("MemoryTieredRedemptionBatchStore finds what it saved", () => {
  const store = newMemoryTieredRedemptionBatchStore();
  const item = newTieredRedemptionBatch("code-27", "label-630");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
