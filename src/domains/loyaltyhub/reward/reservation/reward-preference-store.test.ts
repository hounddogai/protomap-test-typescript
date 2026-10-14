import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardPreferenceStore } from "./reward-preference-store.js";
import { newRewardPreference } from "./reward-preference.js";

test("MemoryRewardPreferenceStore finds what it saved", () => {
  const store = newMemoryRewardPreferenceStore();
  const item = newRewardPreference("code-297", "name-67");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
