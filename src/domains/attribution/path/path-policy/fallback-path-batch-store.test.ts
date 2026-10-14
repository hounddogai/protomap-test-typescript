import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackPathBatchStore } from "./fallback-path-batch-store.js";
import { newFallbackPathBatch } from "./fallback-path-batch.js";

test("MemoryFallbackPathBatchStore finds what it saved", () => {
  const store = newMemoryFallbackPathBatchStore();
  const item = newFallbackPathBatch("code-241", "label-168");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
