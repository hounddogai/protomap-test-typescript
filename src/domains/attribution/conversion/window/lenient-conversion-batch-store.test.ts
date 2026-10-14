import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientConversionBatchStore } from "./lenient-conversion-batch-store.js";
import { newLenientConversionBatch } from "./lenient-conversion-batch.js";

test("MemoryLenientConversionBatchStore finds what it saved", () => {
  const store = newMemoryLenientConversionBatchStore();
  const item = newLenientConversionBatch("code-511", "title-118");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
