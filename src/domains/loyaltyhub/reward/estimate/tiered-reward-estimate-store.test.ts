import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredRewardEstimateStore } from "./tiered-reward-estimate-store.js";
import { newTieredRewardEstimate } from "./tiered-reward-estimate.js";

test("MemoryTieredRewardEstimateStore finds what it saved", () => {
  const store = newMemoryTieredRewardEstimateStore();
  const item = newTieredRewardEstimate("code-92", "label-742");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
