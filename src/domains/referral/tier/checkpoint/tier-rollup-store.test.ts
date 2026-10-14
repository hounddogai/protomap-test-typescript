import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTierRollupStore } from "./tier-rollup-store.js";
import { newTierRollup } from "./tier-rollup.js";

test("MemoryTierRollupStore finds what it saved", () => {
  const store = newMemoryTierRollupStore();
  const item = newTierRollup("code-570", "label-432");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
