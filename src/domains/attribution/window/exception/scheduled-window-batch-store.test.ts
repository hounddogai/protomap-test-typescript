import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledWindowBatchStore } from "./scheduled-window-batch-store.js";
import { newScheduledWindowBatch } from "./scheduled-window-batch.js";

test("MemoryScheduledWindowBatchStore finds what it saved", () => {
  const store = newMemoryScheduledWindowBatchStore();
  const item = newScheduledWindowBatch("code-601", "label-462");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
