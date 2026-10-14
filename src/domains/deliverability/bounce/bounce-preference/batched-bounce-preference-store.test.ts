import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedBouncePreferenceStore } from "./batched-bounce-preference-store.js";
import { newBatchedBouncePreference } from "./batched-bounce-preference.js";

test("MemoryBatchedBouncePreferenceStore finds what it saved", () => {
  const store = newMemoryBatchedBouncePreferenceStore();
  const item = newBatchedBouncePreference("code-443", "label-699");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
