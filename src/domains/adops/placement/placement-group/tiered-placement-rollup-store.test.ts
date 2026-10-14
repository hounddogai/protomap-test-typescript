import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredPlacementRollupStore } from "./tiered-placement-rollup-store.js";
import { newTieredPlacementRollup } from "./tiered-placement-rollup.js";

test("MemoryTieredPlacementRollupStore finds what it saved", () => {
  const store = newMemoryTieredPlacementRollupStore();
  const item = newTieredPlacementRollup("code-376", "name-689");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
