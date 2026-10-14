import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledTouchpointPreferenceStore } from "./scheduled-touchpoint-preference-store.js";
import { newScheduledTouchpointPreference } from "./scheduled-touchpoint-preference.js";

test("MemoryScheduledTouchpointPreferenceStore finds what it saved", () => {
  const store = newMemoryScheduledTouchpointPreferenceStore();
  const item = newScheduledTouchpointPreference("code-118", "name-432");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
