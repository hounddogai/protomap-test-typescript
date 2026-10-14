import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTouchpointBatchStore } from "./touchpoint-batch-store.js";
import { newTouchpointBatch } from "./touchpoint-batch.js";

test("MemoryTouchpointBatchStore finds what it saved", () => {
  const store = newMemoryTouchpointBatchStore();
  const item = newTouchpointBatch("code-105", "title-69");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
