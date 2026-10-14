import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackCreativePreferenceStore } from "./fallback-creative-preference-store.js";
import { newFallbackCreativePreference } from "./fallback-creative-preference.js";

test("MemoryFallbackCreativePreferenceStore finds what it saved", () => {
  const store = newMemoryFallbackCreativePreferenceStore();
  const item = newFallbackCreativePreference("code-815", "title-381");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
