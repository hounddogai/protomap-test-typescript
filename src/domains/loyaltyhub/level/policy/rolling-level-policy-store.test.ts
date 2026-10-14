import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingLevelPolicyStore } from "./rolling-level-policy-store.js";
import { newRollingLevelPolicy } from "./rolling-level-policy.js";

test("MemoryRollingLevelPolicyStore finds what it saved", () => {
  const store = newMemoryRollingLevelPolicyStore();
  const item = newRollingLevelPolicy("code-879", "name-292");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
