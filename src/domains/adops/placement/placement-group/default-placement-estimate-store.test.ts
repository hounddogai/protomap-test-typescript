import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultPlacementEstimateStore } from "./default-placement-estimate-store.js";
import { newDefaultPlacementEstimate } from "./default-placement-estimate.js";

test("MemoryDefaultPlacementEstimateStore finds what it saved", () => {
  const store = newMemoryDefaultPlacementEstimateStore();
  const item = newDefaultPlacementEstimate("code-917", "label-139");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
