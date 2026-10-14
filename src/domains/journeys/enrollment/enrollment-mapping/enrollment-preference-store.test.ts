import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEnrollmentPreferenceStore } from "./enrollment-preference-store.js";
import { newEnrollmentPreference } from "./enrollment-preference.js";

test("MemoryEnrollmentPreferenceStore finds what it saved", () => {
  const store = newMemoryEnrollmentPreferenceStore();
  const item = newEnrollmentPreference("code-215", "title-521");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
