import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPreferencePolicyStore } from "./preference-policy-store.js";
import { newPreferencePolicy } from "./preference-policy.js";

test("MemoryPreferencePolicyStore finds what it saved", () => {
  const store = newMemoryPreferencePolicyStore();
  const item = newPreferencePolicy("code-218", "name-722");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
