import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredWaitVarianceStore } from "./tiered-wait-variance-store.js";
import { newTieredWaitVariance } from "./tiered-wait-variance.js";

test("MemoryTieredWaitVarianceStore finds what it saved", () => {
  const store = newMemoryTieredWaitVarianceStore();
  const item = newTieredWaitVariance("code-202", "name-834");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
