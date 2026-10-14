import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySenderPreferenceStore } from "./sender-preference-store.js";
import { newSenderPreference } from "./sender-preference.js";

test("MemorySenderPreferenceStore finds what it saved", () => {
  const store = newMemorySenderPreferenceStore();
  const item = newSenderPreference("code-291", "name-970");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
