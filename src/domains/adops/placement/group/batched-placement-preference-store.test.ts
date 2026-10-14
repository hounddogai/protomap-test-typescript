import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedPlacementPreferenceStore } from "./batched-placement-preference-store.js";
import { newBatchedPlacementPreference } from "./batched-placement-preference.js";

test("MemoryBatchedPlacementPreferenceStore finds what it saved", () => {
  const store = newMemoryBatchedPlacementPreferenceStore();
  const item = newBatchedPlacementPreference("code-376", "name-280");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
