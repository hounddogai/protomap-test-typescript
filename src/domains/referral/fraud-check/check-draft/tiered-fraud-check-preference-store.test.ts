import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredFraudCheckPreferenceStore } from "./tiered-fraud-check-preference-store.js";
import { newTieredFraudCheckPreference } from "./tiered-fraud-check-preference.js";

test("MemoryTieredFraudCheckPreferenceStore finds what it saved", () => {
  const store = newMemoryTieredFraudCheckPreferenceStore();
  const item = newTieredFraudCheckPreference("code-496", "name-155");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
