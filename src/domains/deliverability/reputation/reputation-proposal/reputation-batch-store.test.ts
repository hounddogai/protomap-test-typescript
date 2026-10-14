import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReputationBatchStore } from "./reputation-batch-store.js";
import { newReputationBatch } from "./reputation-batch.js";

test("MemoryReputationBatchStore finds what it saved", () => {
  const store = newMemoryReputationBatchStore();
  const item = newReputationBatch("code-327", "name-55");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
