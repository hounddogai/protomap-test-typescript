import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPathBatchStore } from "./path-batch-store.js";
import { newPathBatch } from "./path-batch.js";

test("MemoryPathBatchStore finds what it saved", () => {
  const store = newMemoryPathBatchStore();
  const item = newPathBatch("code-990", "label-910");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
