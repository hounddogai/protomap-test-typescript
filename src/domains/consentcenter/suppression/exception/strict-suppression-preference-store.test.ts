import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictSuppressionPreferenceStore } from "./strict-suppression-preference-store.js";
import { newStrictSuppressionPreference } from "./strict-suppression-preference.js";

test("MemoryStrictSuppressionPreferenceStore finds what it saved", () => {
  const store = newMemoryStrictSuppressionPreferenceStore();
  const item = newStrictSuppressionPreference("code-793", "title-876");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
