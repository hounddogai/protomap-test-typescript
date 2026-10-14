import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedStreakExceptionStore } from "./batched-streak-exception-store.js";
import { newBatchedStreakException } from "./batched-streak-exception.js";

test("MemoryBatchedStreakExceptionStore finds what it saved", () => {
  const store = newMemoryBatchedStreakExceptionStore();
  const item = newBatchedStreakException("code-142", "label-19");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
