import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedPathPreferenceStore } from "./batched-path-preference-store.js";
import { newBatchedPathPreference } from "./batched-path-preference.js";

test("MemoryBatchedPathPreferenceStore finds what it saved", () => {
  const store = newMemoryBatchedPathPreferenceStore();
  const item = newBatchedPathPreference("code-96", "title-70");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
