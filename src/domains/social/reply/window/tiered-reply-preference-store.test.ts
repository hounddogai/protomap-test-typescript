import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredReplyPreferenceStore } from "./tiered-reply-preference-store.js";
import { newTieredReplyPreference } from "./tiered-reply-preference.js";

test("MemoryTieredReplyPreferenceStore finds what it saved", () => {
  const store = newMemoryTieredReplyPreferenceStore();
  const item = newTieredReplyPreference("code-910", "name-453");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
