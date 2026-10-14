import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFrequencyBatchStore } from "./frequency-batch-store.js";
import { newFrequencyBatch } from "./frequency-batch.js";

test("MemoryFrequencyBatchStore finds what it saved", () => {
  const store = newMemoryFrequencyBatchStore();
  const item = newFrequencyBatch("code-385", "label-91");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
