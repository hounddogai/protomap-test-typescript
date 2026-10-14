import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedPostExceptionStore } from "./batched-post-exception-store.js";
import { newBatchedPostException } from "./batched-post-exception.js";

test("MemoryBatchedPostExceptionStore finds what it saved", () => {
  const store = newMemoryBatchedPostExceptionStore();
  const item = newBatchedPostException("code-231", "title-192");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
