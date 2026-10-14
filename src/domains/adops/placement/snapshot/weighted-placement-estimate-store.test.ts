import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedPlacementEstimateStore } from "./weighted-placement-estimate-store.js";
import { newWeightedPlacementEstimate } from "./weighted-placement-estimate.js";

test("MemoryWeightedPlacementEstimateStore finds what it saved", () => {
  const store = newMemoryWeightedPlacementEstimateStore();
  const item = newWeightedPlacementEstimate("code-633", "title-685");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
