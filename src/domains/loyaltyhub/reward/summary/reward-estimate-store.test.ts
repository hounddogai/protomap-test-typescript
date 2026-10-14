import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardEstimateStore } from "./reward-estimate-store.js";
import { newRewardEstimate } from "./reward-estimate.js";

test("MemoryRewardEstimateStore finds what it saved", () => {
  const store = newMemoryRewardEstimateStore();
  const item = newRewardEstimate("code-567", "title-880");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
