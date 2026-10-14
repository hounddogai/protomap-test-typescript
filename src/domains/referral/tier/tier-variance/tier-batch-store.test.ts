import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTierBatchStore } from "./tier-batch-store.js";
import { newTierBatch } from "./tier-batch.js";

test("MemoryTierBatchStore finds what it saved", () => {
  const store = newMemoryTierBatchStore();
  const item = newTierBatch("code-127", "title-262");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
