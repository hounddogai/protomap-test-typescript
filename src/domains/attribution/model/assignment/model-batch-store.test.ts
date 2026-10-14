import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryModelBatchStore } from "./model-batch-store.js";
import { newModelBatch } from "./model-batch.js";

test("MemoryModelBatchStore finds what it saved", () => {
  const store = newMemoryModelBatchStore();
  const item = newModelBatch("code-219", "label-144");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
