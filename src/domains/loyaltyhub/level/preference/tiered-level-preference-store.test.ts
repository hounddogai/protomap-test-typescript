import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredLevelPreferenceStore } from "./tiered-level-preference-store.js";
import { newTieredLevelPreference } from "./tiered-level-preference.js";

test("MemoryTieredLevelPreferenceStore finds what it saved", () => {
  const store = newMemoryTieredLevelPreferenceStore();
  const item = newTieredLevelPreference("code-172", "label-39");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
