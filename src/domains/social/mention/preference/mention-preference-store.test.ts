import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMentionPreferenceStore } from "./mention-preference-store.js";
import { newMentionPreference } from "./mention-preference.js";

test("MemoryMentionPreferenceStore finds what it saved", () => {
  const store = newMemoryMentionPreferenceStore();
  const item = newMentionPreference("code-645", "name-242");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
