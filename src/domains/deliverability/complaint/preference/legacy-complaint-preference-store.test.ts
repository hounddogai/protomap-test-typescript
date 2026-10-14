import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyComplaintPreferenceStore } from "./legacy-complaint-preference-store.js";
import { newLegacyComplaintPreference } from "./legacy-complaint-preference.js";

test("MemoryLegacyComplaintPreferenceStore finds what it saved", () => {
  const store = newMemoryLegacyComplaintPreferenceStore();
  const item = newLegacyComplaintPreference("code-431", "title-300");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
