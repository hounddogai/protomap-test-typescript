import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryWarmupPolicyStore } from "./primary-warmup-policy-store.js";
import { newPrimaryWarmupPolicy } from "./primary-warmup-policy.js";

test("MemoryPrimaryWarmupPolicyStore finds what it saved", () => {
  const store = newMemoryPrimaryWarmupPolicyStore();
  const item = newPrimaryWarmupPolicy("code-150", "label-167");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
