import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalRewardEstimateStore } from "./global-reward-estimate-store.js";
import { newGlobalRewardEstimate } from "./global-reward-estimate.js";

test("MemoryGlobalRewardEstimateStore finds what it saved", () => {
  const store = newMemoryGlobalRewardEstimateStore();
  const item = newGlobalRewardEstimate("code-41", "title-856");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
