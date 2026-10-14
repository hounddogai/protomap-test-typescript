import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalBranchPolicyStore } from "./global-branch-policy-store.js";
import { newGlobalBranchPolicy } from "./global-branch-policy.js";

test("MemoryGlobalBranchPolicyStore finds what it saved", () => {
  const store = newMemoryGlobalBranchPolicyStore();
  const item = newGlobalBranchPolicy("code-868", "name-490");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
