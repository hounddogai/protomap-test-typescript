import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientWaitPolicyStore } from "./lenient-wait-policy-store.js";
import { newLenientWaitPolicy } from "./lenient-wait-policy.js";

test("MemoryLenientWaitPolicyStore finds what it saved", () => {
  const store = newMemoryLenientWaitPolicyStore();
  const item = newLenientWaitPolicy("code-747", "title-80");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
