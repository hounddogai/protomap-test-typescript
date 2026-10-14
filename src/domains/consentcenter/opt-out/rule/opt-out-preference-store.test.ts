import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryOptOutPreferenceStore } from "./opt-out-preference-store.js";
import { newOptOutPreference } from "./opt-out-preference.js";

test("MemoryOptOutPreferenceStore finds what it saved", () => {
  const store = newMemoryOptOutPreferenceStore();
  const item = newOptOutPreference("code-91", "label-284");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
