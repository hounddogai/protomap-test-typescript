import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPostBatchStore } from "./post-batch-store.js";
import { newPostBatch } from "./post-batch.js";

test("MemoryPostBatchStore finds what it saved", () => {
  const store = newMemoryPostBatchStore();
  const item = newPostBatch("code-18", "name-8");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
