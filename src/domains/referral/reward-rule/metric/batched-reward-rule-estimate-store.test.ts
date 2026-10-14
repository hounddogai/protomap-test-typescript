import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedRewardRuleEstimateStore } from "./batched-reward-rule-estimate-store.js";
import { newBatchedRewardRuleEstimate } from "./batched-reward-rule-estimate.js";

test("MemoryBatchedRewardRuleEstimateStore finds what it saved", () => {
  const store = newMemoryBatchedRewardRuleEstimateStore();
  const item = newBatchedRewardRuleEstimate("code-94", "label-860");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
