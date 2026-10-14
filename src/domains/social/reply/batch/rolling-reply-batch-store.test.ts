import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingReplyBatchStore } from "./rolling-reply-batch-store.js";
import { newRollingReplyBatch } from "./rolling-reply-batch.js";

test("MemoryRollingReplyBatchStore finds what it saved", () => {
  const store = newMemoryRollingReplyBatchStore();
  const item = newRollingReplyBatch("code-510", "label-129");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
