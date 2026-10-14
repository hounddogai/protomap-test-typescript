import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredPlacementThresholdStore } from "./tiered-placement-threshold-store.js";
import { newTieredPlacementThreshold } from "./tiered-placement-threshold.js";

test("MemoryTieredPlacementThresholdStore finds what it saved", () => {
  const store = newMemoryTieredPlacementThresholdStore();
  const item = newTieredPlacementThreshold("code-274", "name-177");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
