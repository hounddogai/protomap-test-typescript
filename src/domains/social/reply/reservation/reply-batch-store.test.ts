import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReplyBatchStore } from "./reply-batch-store.js";
import { newReplyBatch } from "./reply-batch.js";

test("MemoryReplyBatchStore finds what it saved", () => {
  const store = newMemoryReplyBatchStore();
  const item = newReplyBatch("code-32", "label-970");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
