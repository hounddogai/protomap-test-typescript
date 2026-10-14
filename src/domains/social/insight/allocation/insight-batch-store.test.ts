import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInsightBatchStore } from "./insight-batch-store.js";
import { newInsightBatch } from "./insight-batch.js";

test("MemoryInsightBatchStore finds what it saved", () => {
  const store = newMemoryInsightBatchStore();
  const item = newInsightBatch("code-185", "name-871");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
