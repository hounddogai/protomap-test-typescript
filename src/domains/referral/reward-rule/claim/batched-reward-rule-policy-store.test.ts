import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedRewardRulePolicyStore } from "./batched-reward-rule-policy-store.js";
import { newBatchedRewardRulePolicy } from "./batched-reward-rule-policy.js";

test("MemoryBatchedRewardRulePolicyStore finds what it saved", () => {
  const store = newMemoryBatchedRewardRulePolicyStore();
  const item = newBatchedRewardRulePolicy("code-87", "title-579");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
