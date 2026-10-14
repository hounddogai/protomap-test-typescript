import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientPayoutPreferenceStore } from "./lenient-payout-preference-store.js";
import { newLenientPayoutPreference } from "./lenient-payout-preference.js";

test("MemoryLenientPayoutPreferenceStore finds what it saved", () => {
  const store = newMemoryLenientPayoutPreferenceStore();
  const item = newLenientPayoutPreference("code-621", "name-254");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
