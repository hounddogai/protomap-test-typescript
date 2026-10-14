import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreativePreferenceStore } from "./creative-preference-store.js";
import { newCreativePreference } from "./creative-preference.js";

test("MemoryCreativePreferenceStore finds what it saved", () => {
  const store = newMemoryCreativePreferenceStore();
  const item = newCreativePreference("code-753", "label-813");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
