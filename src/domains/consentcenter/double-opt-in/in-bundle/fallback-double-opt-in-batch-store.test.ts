import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackDoubleOptInBatchStore } from "./fallback-double-opt-in-batch-store.js";
import { newFallbackDoubleOptInBatch } from "./fallback-double-opt-in-batch.js";

test("MemoryFallbackDoubleOptInBatchStore finds what it saved", () => {
  const store = newMemoryFallbackDoubleOptInBatchStore();
  const item = newFallbackDoubleOptInBatch("code-723", "title-544");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
