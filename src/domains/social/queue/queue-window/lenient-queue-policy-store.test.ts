import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientQueuePolicyStore } from "./lenient-queue-policy-store.js";
import { newLenientQueuePolicy } from "./lenient-queue-policy.js";

test("MemoryLenientQueuePolicyStore finds what it saved", () => {
  const store = newMemoryLenientQueuePolicyStore();
  const item = newLenientQueuePolicy("code-744", "name-691");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
