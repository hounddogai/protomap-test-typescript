import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPlacementEstimateStore } from "./placement-estimate-store.js";
import { newPlacementEstimate } from "./placement-estimate.js";

test("MemoryPlacementEstimateStore finds what it saved", () => {
  const store = newMemoryPlacementEstimateStore();
  const item = newPlacementEstimate("code-702", "label-955");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
