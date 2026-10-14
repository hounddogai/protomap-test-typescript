import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledSlaPreferenceStore } from "./scheduled-sla-preference-store.js";
import { newScheduledSlaPreference } from "./scheduled-sla-preference.js";

test("MemoryScheduledSlaPreferenceStore finds what it saved", () => {
  const store = newMemoryScheduledSlaPreferenceStore();
  const item = newScheduledSlaPreference("code-181", "name-915");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
