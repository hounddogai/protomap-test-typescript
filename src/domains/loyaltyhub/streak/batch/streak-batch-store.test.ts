import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStreakBatchStore } from "./streak-batch-store.js";
import { newStreakBatch } from "./streak-batch.js";

test("MemoryStreakBatchStore finds what it saved", () => {
  const store = newMemoryStreakBatchStore();
  const item = newStreakBatch("code-769", "title-773");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
