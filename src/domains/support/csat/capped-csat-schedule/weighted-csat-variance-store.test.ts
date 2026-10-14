import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedCsatVarianceStore } from "./weighted-csat-variance-store.js";
import { newWeightedCsatVariance } from "./weighted-csat-variance.js";

test("MemoryWeightedCsatVarianceStore finds what it saved", () => {
  const store = newMemoryWeightedCsatVarianceStore();
  const item = newWeightedCsatVariance("code-451", "name-899");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
