import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCsatBatchStore } from "./csat-batch-store.js";
import { newCsatBatch } from "./csat-batch.js";

test("MemoryCsatBatchStore finds what it saved", () => {
  const store = newMemoryCsatBatchStore();
  const item = newCsatBatch("code-119", "name-778");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
