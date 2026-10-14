import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedFlightVarianceStore } from "./weighted-flight-variance-store.js";
import { newWeightedFlightVariance } from "./weighted-flight-variance.js";

test("MemoryWeightedFlightVarianceStore finds what it saved", () => {
  const store = newMemoryWeightedFlightVarianceStore();
  const item = newWeightedFlightVariance("code-711", "title-619");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
