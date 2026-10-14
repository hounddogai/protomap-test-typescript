import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedBouncePreferenceStore } from "./weighted-bounce-preference-store.js";
import { newWeightedBouncePreference } from "./weighted-bounce-preference.js";

test("MemoryWeightedBouncePreferenceStore finds what it saved", () => {
  const store = newMemoryWeightedBouncePreferenceStore();
  const item = newWeightedBouncePreference("code-573", "name-298");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
