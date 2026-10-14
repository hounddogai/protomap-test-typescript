import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBranchBatchStore } from "./branch-batch-store.js";
import { newBranchBatch } from "./branch-batch.js";

test("MemoryBranchBatchStore finds what it saved", () => {
  const store = newMemoryBranchBatchStore();
  const item = newBranchBatch("code-444", "name-910");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
