import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMentionBatchStore } from "./mention-batch-store.js";
import { newMentionBatch } from "./mention-batch.js";

test("MemoryMentionBatchStore finds what it saved", () => {
  const store = newMemoryMentionBatchStore();
  const item = newMentionBatch("code-226", "name-620");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
