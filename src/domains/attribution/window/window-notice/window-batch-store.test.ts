import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWindowBatchStore } from "./window-batch-store.js";
import { newWindowBatch } from "./window-batch.js";

test("MemoryWindowBatchStore finds what it saved", () => {
  const store = newMemoryWindowBatchStore();
  const item = newWindowBatch("code-90", "label-334");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
