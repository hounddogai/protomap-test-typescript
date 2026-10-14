import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedPreferencePolicyStore } from "./weighted-preference-policy-store.js";
import { newWeightedPreferencePolicy } from "./weighted-preference-policy.js";

test("MemoryWeightedPreferencePolicyStore finds what it saved", () => {
  const store = newMemoryWeightedPreferencePolicyStore();
  const item = newWeightedPreferencePolicy("code-312", "name-882");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
