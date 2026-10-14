import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedTouchpointPreferenceStore } from "./batched-touchpoint-preference-store.js";
import { newBatchedTouchpointPreference } from "./batched-touchpoint-preference.js";

test("MemoryBatchedTouchpointPreferenceStore finds what it saved", () => {
  const store = newMemoryBatchedTouchpointPreferenceStore();
  const item = newBatchedTouchpointPreference("code-578", "label-452");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
