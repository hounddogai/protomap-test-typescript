import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRetentionPolicyStore } from "./retention-policy-store.js";
import { newRetentionPolicy } from "./retention-policy.js";

test("MemoryRetentionPolicyStore finds what it saved", () => {
  const store = newMemoryRetentionPolicyStore();
  const item = newRetentionPolicy("code-888", "name-570");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
