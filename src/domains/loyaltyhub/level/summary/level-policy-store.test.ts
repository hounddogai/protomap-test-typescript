import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLevelPolicyStore } from "./level-policy-store.js";
import { newLevelPolicy } from "./level-policy.js";

test("MemoryLevelPolicyStore finds what it saved", () => {
  const store = newMemoryLevelPolicyStore();
  const item = newLevelPolicy("code-52", "name-776");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
