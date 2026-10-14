import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedWarmupExceptionStore } from "./batched-warmup-exception-store.js";
import { newBatchedWarmupException } from "./batched-warmup-exception.js";

test("MemoryBatchedWarmupExceptionStore finds what it saved", () => {
  const store = newMemoryBatchedWarmupExceptionStore();
  const item = newBatchedWarmupException("code-115", "name-13");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
