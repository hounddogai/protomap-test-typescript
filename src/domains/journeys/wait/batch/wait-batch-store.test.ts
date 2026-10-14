import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWaitBatchStore } from "./wait-batch-store.js";
import { newWaitBatch } from "./wait-batch.js";

test("MemoryWaitBatchStore finds what it saved", () => {
  const store = newMemoryWaitBatchStore();
  const item = newWaitBatch("code-611", "title-819");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
