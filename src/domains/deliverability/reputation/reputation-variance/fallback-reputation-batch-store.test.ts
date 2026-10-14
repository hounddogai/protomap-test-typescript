import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackReputationBatchStore } from "./fallback-reputation-batch-store.js";
import { newFallbackReputationBatch } from "./fallback-reputation-batch.js";

test("MemoryFallbackReputationBatchStore finds what it saved", () => {
  const store = newMemoryFallbackReputationBatchStore();
  const item = newFallbackReputationBatch("code-381", "title-366");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
