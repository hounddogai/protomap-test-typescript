import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptivePreferencePolicyStore } from "./adaptive-preference-policy-store.js";
import { newAdaptivePreferencePolicy } from "./adaptive-preference-policy.js";

test("MemoryAdaptivePreferencePolicyStore finds what it saved", () => {
  const store = newMemoryAdaptivePreferencePolicyStore();
  const item = newAdaptivePreferencePolicy("code-373", "title-941");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
