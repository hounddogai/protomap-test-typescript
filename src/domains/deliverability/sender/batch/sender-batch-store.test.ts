import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySenderBatchStore } from "./sender-batch-store.js";
import { newSenderBatch } from "./sender-batch.js";

test("MemorySenderBatchStore finds what it saved", () => {
  const store = newMemorySenderBatchStore();
  const item = newSenderBatch("code-347", "label-48");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
