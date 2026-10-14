import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPathPreferenceStore } from "./path-preference-store.js";
import { newPathPreference } from "./path-preference.js";

test("MemoryPathPreferenceStore finds what it saved", () => {
  const store = newMemoryPathPreferenceStore();
  const item = newPathPreference("code-983", "title-620");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
