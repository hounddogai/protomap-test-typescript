import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySuppressionPreferenceStore } from "./suppression-preference-store.js";
import { newSuppressionPreference } from "./suppression-preference.js";

test("MemorySuppressionPreferenceStore finds what it saved", () => {
  const store = newMemorySuppressionPreferenceStore();
  const item = newSuppressionPreference("code-682", "title-138");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
