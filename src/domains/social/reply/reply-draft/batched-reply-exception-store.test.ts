import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedReplyExceptionStore } from "./batched-reply-exception-store.js";
import { newBatchedReplyException } from "./batched-reply-exception.js";

test("MemoryBatchedReplyExceptionStore finds what it saved", () => {
  const store = newMemoryBatchedReplyExceptionStore();
  const item = newBatchedReplyException("code-623", "name-396");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
