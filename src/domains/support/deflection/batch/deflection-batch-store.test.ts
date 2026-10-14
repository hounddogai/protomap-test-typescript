import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDeflectionBatchStore } from "./deflection-batch-store.js";
import { newDeflectionBatch } from "./deflection-batch.js";

test("MemoryDeflectionBatchStore finds what it saved", () => {
  const store = newMemoryDeflectionBatchStore();
  const item = newDeflectionBatch("code-109", "name-304");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
