import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRedemptionPreferenceStore } from "./redemption-preference-store.js";
import { newRedemptionPreference } from "./redemption-preference.js";

test("MemoryRedemptionPreferenceStore finds what it saved", () => {
  const store = newMemoryRedemptionPreferenceStore();
  const item = newRedemptionPreference("code-263", "title-123");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
