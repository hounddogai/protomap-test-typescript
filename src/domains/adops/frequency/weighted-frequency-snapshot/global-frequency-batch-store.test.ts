import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalFrequencyBatchStore } from "./global-frequency-batch-store.js";
import { newGlobalFrequencyBatch } from "./global-frequency-batch.js";

test("MemoryGlobalFrequencyBatchStore finds what it saved", () => {
  const store = newMemoryGlobalFrequencyBatchStore();
  const item = newGlobalFrequencyBatch("code-188", "name-11");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
