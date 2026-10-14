import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReplyPreferenceStore } from "./reply-preference-store.js";
import { newReplyPreference } from "./reply-preference.js";

test("MemoryReplyPreferenceStore finds what it saved", () => {
  const store = newMemoryReplyPreferenceStore();
  const item = newReplyPreference("code-850", "title-77");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
