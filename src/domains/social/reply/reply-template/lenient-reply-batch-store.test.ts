import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientReplyBatchStore } from "./lenient-reply-batch-store.js";
import { newLenientReplyBatch } from "./lenient-reply-batch.js";

test("MemoryLenientReplyBatchStore finds what it saved", () => {
  const store = newMemoryLenientReplyBatchStore();
  const item = newLenientReplyBatch("code-51", "name-26");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
