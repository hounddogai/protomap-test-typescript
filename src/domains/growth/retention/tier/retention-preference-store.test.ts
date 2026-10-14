import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRetentionPreferenceStore } from "./retention-preference-store.js";
import { newRetentionPreference } from "./retention-preference.js";

test("MemoryRetentionPreferenceStore finds what it saved", () => {
  const store = newMemoryRetentionPreferenceStore();
  const item = newRetentionPreference("code-985", "name-248");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
