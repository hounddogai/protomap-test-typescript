import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySubscriptionPreferenceStore } from "./subscription-preference-store.js";
import { newSubscriptionPreference } from "./subscription-preference.js";

test("MemorySubscriptionPreferenceStore finds what it saved", () => {
  const store = newMemorySubscriptionPreferenceStore();
  const item = newSubscriptionPreference("code-211", "name-968");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
