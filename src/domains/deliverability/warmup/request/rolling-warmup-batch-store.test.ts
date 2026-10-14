import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingWarmupBatchStore } from "./rolling-warmup-batch-store.js";
import { newRollingWarmupBatch } from "./rolling-warmup-batch.js";

test("MemoryRollingWarmupBatchStore finds what it saved", () => {
  const store = newMemoryRollingWarmupBatchStore();
  const item = newRollingWarmupBatch("code-28", "label-559");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
