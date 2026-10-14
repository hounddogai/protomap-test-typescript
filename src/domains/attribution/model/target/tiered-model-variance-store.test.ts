import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredModelVarianceStore } from "./tiered-model-variance-store.js";
import { newTieredModelVariance } from "./tiered-model-variance.js";

test("MemoryTieredModelVarianceStore finds what it saved", () => {
  const store = newMemoryTieredModelVarianceStore();
  const item = newTieredModelVariance("code-981", "title-208");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
