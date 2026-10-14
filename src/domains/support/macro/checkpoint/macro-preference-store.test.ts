import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMacroPreferenceStore } from "./macro-preference-store.js";
import { newMacroPreference } from "./macro-preference.js";

test("MemoryMacroPreferenceStore finds what it saved", () => {
  const store = newMemoryMacroPreferenceStore();
  const item = newMacroPreference("code-215", "label-177");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
