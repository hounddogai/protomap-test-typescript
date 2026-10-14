import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPostPreferenceStore } from "./post-preference-store.js";
import { newPostPreference } from "./post-preference.js";

test("MemoryPostPreferenceStore finds what it saved", () => {
  const store = newMemoryPostPreferenceStore();
  const item = newPostPreference("code-126", "name-810");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
