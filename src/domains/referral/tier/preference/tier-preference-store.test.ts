import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTierPreferenceStore } from "./tier-preference-store.js";
import { newTierPreference } from "./tier-preference.js";

test("MemoryTierPreferenceStore finds what it saved", () => {
  const store = newMemoryTierPreferenceStore();
  const item = newTierPreference("code-802", "name-237");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
