import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultRetentionBatchStore } from "./default-retention-batch-store.js";
import { newDefaultRetentionBatch } from "./default-retention-batch.js";

test("MemoryDefaultRetentionBatchStore finds what it saved", () => {
  const store = newMemoryDefaultRetentionBatchStore();
  const item = newDefaultRetentionBatch("code-554", "label-411");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
