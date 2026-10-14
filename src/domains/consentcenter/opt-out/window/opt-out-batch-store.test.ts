import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryOptOutBatchStore } from "./opt-out-batch-store.js";
import { newOptOutBatch } from "./opt-out-batch.js";

test("MemoryOptOutBatchStore finds what it saved", () => {
  const store = newMemoryOptOutBatchStore();
  const item = newOptOutBatch("code-609", "title-88");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
