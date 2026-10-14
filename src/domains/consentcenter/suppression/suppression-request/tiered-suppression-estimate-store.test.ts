import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredSuppressionEstimateStore } from "./tiered-suppression-estimate-store.js";
import { newTieredSuppressionEstimate } from "./tiered-suppression-estimate.js";

test("MemoryTieredSuppressionEstimateStore finds what it saved", () => {
  const store = newMemoryTieredSuppressionEstimateStore();
  const item = newTieredSuppressionEstimate("code-267", "name-36");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
