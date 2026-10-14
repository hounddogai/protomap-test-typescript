import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientCreditPreferenceStore } from "./lenient-credit-preference-store.js";
import { newLenientCreditPreference } from "./lenient-credit-preference.js";

test("MemoryLenientCreditPreferenceStore finds what it saved", () => {
  const store = newMemoryLenientCreditPreferenceStore();
  const item = newLenientCreditPreference("code-968", "title-759");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
