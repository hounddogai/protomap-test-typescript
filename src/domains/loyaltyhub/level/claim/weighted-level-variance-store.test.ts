import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedLevelVarianceStore } from "./weighted-level-variance-store.js";
import { newWeightedLevelVariance } from "./weighted-level-variance.js";

test("MemoryWeightedLevelVarianceStore finds what it saved", () => {
  const store = newMemoryWeightedLevelVarianceStore();
  const item = newWeightedLevelVariance("code-170", "label-517");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
