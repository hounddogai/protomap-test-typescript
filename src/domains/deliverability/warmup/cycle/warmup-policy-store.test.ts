import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWarmupPolicyStore } from "./warmup-policy-store.js";
import { newWarmupPolicy } from "./warmup-policy.js";

test("MemoryWarmupPolicyStore finds what it saved", () => {
  const store = newMemoryWarmupPolicyStore();
  const item = newWarmupPolicy("code-123", "name-659");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
