import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredPostRollupStore } from "./tiered-post-rollup-store.js";
import { newTieredPostRollup } from "./tiered-post-rollup.js";

test("MemoryTieredPostRollupStore finds what it saved", () => {
  const store = newMemoryTieredPostRollupStore();
  const item = newTieredPostRollup("code-481", "name-952");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
