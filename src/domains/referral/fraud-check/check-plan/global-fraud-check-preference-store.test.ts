import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalFraudCheckPreferenceStore } from "./global-fraud-check-preference-store.js";
import { newGlobalFraudCheckPreference } from "./global-fraud-check-preference.js";

test("MemoryGlobalFraudCheckPreferenceStore finds what it saved", () => {
  const store = newMemoryGlobalFraudCheckPreferenceStore();
  const item = newGlobalFraudCheckPreference("code-211", "name-556");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
