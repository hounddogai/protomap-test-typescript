import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackComplaintPolicyStore } from "./fallback-complaint-policy-store.js";
import { newFallbackComplaintPolicy } from "./fallback-complaint-policy.js";

test("MemoryFallbackComplaintPolicyStore finds what it saved", () => {
  const store = newMemoryFallbackComplaintPolicyStore();
  const item = newFallbackComplaintPolicy("code-442", "name-636");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
