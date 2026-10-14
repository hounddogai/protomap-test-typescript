import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientPathPreferenceStore } from "./lenient-path-preference-store.js";
import { newLenientPathPreference } from "./lenient-path-preference.js";

test("MemoryLenientPathPreferenceStore finds what it saved", () => {
  const store = newMemoryLenientPathPreferenceStore();
  const item = newLenientPathPreference("code-760", "name-537");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
