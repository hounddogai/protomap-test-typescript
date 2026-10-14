import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualReplyPreferenceStore } from "./manual-reply-preference-store.js";
import { newManualReplyPreference } from "./manual-reply-preference.js";

test("MemoryManualReplyPreferenceStore finds what it saved", () => {
  const store = newMemoryManualReplyPreferenceStore();
  const item = newManualReplyPreference("code-168", "name-449");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
