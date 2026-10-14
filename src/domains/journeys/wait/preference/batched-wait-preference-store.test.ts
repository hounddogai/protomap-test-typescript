import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedWaitPreferenceStore } from "./batched-wait-preference-store.js";
import { newBatchedWaitPreference } from "./batched-wait-preference.js";

test("MemoryBatchedWaitPreferenceStore finds what it saved", () => {
  const store = newMemoryBatchedWaitPreferenceStore();
  const item = newBatchedWaitPreference("code-481", "title-657");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
