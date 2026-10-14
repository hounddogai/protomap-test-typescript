import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredModelPolicyStore } from "./tiered-model-policy-store.js";
import { newTieredModelPolicy } from "./tiered-model-policy.js";

test("MemoryTieredModelPolicyStore finds what it saved", () => {
  const store = newMemoryTieredModelPolicyStore();
  const item = newTieredModelPolicy("code-949", "name-595");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
