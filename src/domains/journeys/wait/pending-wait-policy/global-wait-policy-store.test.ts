import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalWaitPolicyStore } from "./global-wait-policy-store.js";
import { newGlobalWaitPolicy } from "./global-wait-policy.js";

test("MemoryGlobalWaitPolicyStore finds what it saved", () => {
  const store = newMemoryGlobalWaitPolicyStore();
  const item = newGlobalWaitPolicy("code-317", "label-838");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
