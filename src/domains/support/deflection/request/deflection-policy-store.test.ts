import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDeflectionPolicyStore } from "./deflection-policy-store.js";
import { newDeflectionPolicy } from "./deflection-policy.js";

test("MemoryDeflectionPolicyStore finds what it saved", () => {
  const store = newMemoryDeflectionPolicyStore();
  const item = newDeflectionPolicy("code-496", "name-352");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
