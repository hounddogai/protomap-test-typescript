import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledCreativePreferenceStore } from "./scheduled-creative-preference-store.js";
import { newScheduledCreativePreference } from "./scheduled-creative-preference.js";

test("MemoryScheduledCreativePreferenceStore finds what it saved", () => {
  const store = newMemoryScheduledCreativePreferenceStore();
  const item = newScheduledCreativePreference("code-900", "label-582");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
