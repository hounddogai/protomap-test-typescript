import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedJourneyTargetStore } from "./weighted-journey-target-store.js";
import { newWeightedJourneyTarget } from "./weighted-journey-target.js";

test("MemoryWeightedJourneyTargetStore finds what it saved", () => {
  const store = newMemoryWeightedJourneyTargetStore();
  const item = newWeightedJourneyTarget("code-784", "label-401");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
