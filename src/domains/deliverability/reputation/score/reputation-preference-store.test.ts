import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReputationPreferenceStore } from "./reputation-preference-store.js";
import { newReputationPreference } from "./reputation-preference.js";

test("MemoryReputationPreferenceStore finds what it saved", () => {
  const store = newMemoryReputationPreferenceStore();
  const item = newReputationPreference("code-19", "name-13");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
