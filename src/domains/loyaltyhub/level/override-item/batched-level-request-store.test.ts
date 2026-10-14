import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedLevelRequestStore } from "./batched-level-request-store.js";
import { newBatchedLevelRequest } from "./batched-level-request.js";

test("MemoryBatchedLevelRequestStore finds what it saved", () => {
  const store = newMemoryBatchedLevelRequestStore();
  const item = newBatchedLevelRequest("code-977", "title-517");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
