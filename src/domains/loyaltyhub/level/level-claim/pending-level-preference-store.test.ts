import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingLevelPreferenceStore } from "./pending-level-preference-store.js";
import { newPendingLevelPreference } from "./pending-level-preference.js";

test("MemoryPendingLevelPreferenceStore finds what it saved", () => {
  const store = newMemoryPendingLevelPreferenceStore();
  const item = newPendingLevelPreference("code-850", "name-440");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
