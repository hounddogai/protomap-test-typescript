import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackCreditPreferenceStore } from "./fallback-credit-preference-store.js";
import { newFallbackCreditPreference } from "./fallback-credit-preference.js";

test("MemoryFallbackCreditPreferenceStore finds what it saved", () => {
  const store = newMemoryFallbackCreditPreferenceStore();
  const item = newFallbackCreditPreference("code-991", "name-574");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
