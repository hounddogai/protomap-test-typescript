import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPayoutPreferenceStore } from "./payout-preference-store.js";
import { newPayoutPreference } from "./payout-preference.js";

test("MemoryPayoutPreferenceStore finds what it saved", () => {
  const store = newMemoryPayoutPreferenceStore();
  const item = newPayoutPreference("code-672", "title-694");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
