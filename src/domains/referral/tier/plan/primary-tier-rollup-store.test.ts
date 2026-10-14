import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryTierRollupStore } from "./primary-tier-rollup-store.js";
import { newPrimaryTierRollup } from "./primary-tier-rollup.js";

test("MemoryPrimaryTierRollupStore finds what it saved", () => {
  const store = newMemoryPrimaryTierRollupStore();
  const item = newPrimaryTierRollup("code-571", "label-527");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
