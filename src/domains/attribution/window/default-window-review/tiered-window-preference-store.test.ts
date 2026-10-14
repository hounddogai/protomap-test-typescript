import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredWindowPreferenceStore } from "./tiered-window-preference-store.js";
import { newTieredWindowPreference } from "./tiered-window-preference.js";

test("MemoryTieredWindowPreferenceStore finds what it saved", () => {
  const store = newMemoryTieredWindowPreferenceStore();
  const item = newTieredWindowPreference("code-55", "label-758");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
