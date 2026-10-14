import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedWaitPolicyStore } from "./batched-wait-policy-store.js";
import { newBatchedWaitPolicy } from "./batched-wait-policy.js";

test("MemoryBatchedWaitPolicyStore finds what it saved", () => {
  const store = newMemoryBatchedWaitPolicyStore();
  const item = newBatchedWaitPolicy("code-143", "title-608");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
