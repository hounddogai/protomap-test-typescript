import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualPlacementThresholdStore } from "./manual-placement-threshold-store.js";
import { newManualPlacementThreshold } from "./manual-placement-threshold.js";

test("MemoryManualPlacementThresholdStore finds what it saved", () => {
  const store = newMemoryManualPlacementThresholdStore();
  const item = newManualPlacementThreshold("code-771", "label-195");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
