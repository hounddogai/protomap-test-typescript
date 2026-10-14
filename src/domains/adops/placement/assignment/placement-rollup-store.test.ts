import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPlacementRollupStore } from "./placement-rollup-store.js";
import { newPlacementRollup } from "./placement-rollup.js";

test("MemoryPlacementRollupStore finds what it saved", () => {
  const store = newMemoryPlacementRollupStore();
  const item = newPlacementRollup("code-563", "name-727");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
