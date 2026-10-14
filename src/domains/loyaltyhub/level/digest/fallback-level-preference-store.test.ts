import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackLevelPreferenceStore } from "./fallback-level-preference-store.js";
import { newFallbackLevelPreference } from "./fallback-level-preference.js";

test("MemoryFallbackLevelPreferenceStore finds what it saved", () => {
  const store = newMemoryFallbackLevelPreferenceStore();
  const item = newFallbackLevelPreference("code-633", "label-74");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
