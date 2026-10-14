import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLevelPreferenceStore } from "./level-preference-store.js";
import { newLevelPreference } from "./level-preference.js";

test("MemoryLevelPreferenceStore finds what it saved", () => {
  const store = newMemoryLevelPreferenceStore();
  const item = newLevelPreference("code-20", "title-379");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
