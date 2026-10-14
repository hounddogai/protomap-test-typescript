import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFraudCheckPreferenceStore } from "./fraud-check-preference-store.js";
import { newFraudCheckPreference } from "./fraud-check-preference.js";

test("MemoryFraudCheckPreferenceStore finds what it saved", () => {
  const store = newMemoryFraudCheckPreferenceStore();
  const item = newFraudCheckPreference("code-549", "name-433");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
