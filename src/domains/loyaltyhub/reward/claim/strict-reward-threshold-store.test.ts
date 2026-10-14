import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictRewardThresholdStore } from "./strict-reward-threshold-store.js";
import { newStrictRewardThreshold } from "./strict-reward-threshold.js";

test("MemoryStrictRewardThresholdStore finds what it saved", () => {
  const store = newMemoryStrictRewardThresholdStore();
  const item = newStrictRewardThreshold("code-574", "label-71");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
