import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedPlacementRollupStore } from "./batched-placement-rollup-store.js";
import { newBatchedPlacementRollup } from "./batched-placement-rollup.js";

test("MemoryBatchedPlacementRollupStore finds what it saved", () => {
  const store = newMemoryBatchedPlacementRollupStore();
  const item = newBatchedPlacementRollup("code-269", "name-283");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
