import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedMentionPreferenceStore } from "./capped-mention-preference-store.js";
import { newCappedMentionPreference } from "./capped-mention-preference.js";

test("MemoryCappedMentionPreferenceStore finds what it saved", () => {
  const store = newMemoryCappedMentionPreferenceStore();
  const item = newCappedMentionPreference("code-700", "title-459");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
