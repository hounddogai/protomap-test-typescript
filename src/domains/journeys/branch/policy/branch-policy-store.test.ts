import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBranchPolicyStore } from "./branch-policy-store.js";
import { newBranchPolicy } from "./branch-policy.js";

test("MemoryBranchPolicyStore finds what it saved", () => {
  const store = newMemoryBranchPolicyStore();
  const item = newBranchPolicy("code-999", "name-197");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
