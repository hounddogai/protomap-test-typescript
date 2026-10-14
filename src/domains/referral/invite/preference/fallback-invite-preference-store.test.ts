import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackInvitePreferenceStore } from "./fallback-invite-preference-store.js";
import { newFallbackInvitePreference } from "./fallback-invite-preference.js";

test("MemoryFallbackInvitePreferenceStore finds what it saved", () => {
  const store = newMemoryFallbackInvitePreferenceStore();
  const item = newFallbackInvitePreference("code-213", "title-290");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
