import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWarmupPreferenceStore } from "./warmup-preference-store.js";
import { newWarmupPreference } from "./warmup-preference.js";

test("MemoryWarmupPreferenceStore finds what it saved", () => {
  const store = newMemoryWarmupPreferenceStore();
  const item = newWarmupPreference("code-404", "label-905");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
