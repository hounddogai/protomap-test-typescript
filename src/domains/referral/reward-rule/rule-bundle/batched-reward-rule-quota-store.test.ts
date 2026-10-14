import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedRewardRuleQuotaStore } from "./batched-reward-rule-quota-store.js";
import { newBatchedRewardRuleQuota } from "./batched-reward-rule-quota.js";

test("MemoryBatchedRewardRuleQuotaStore finds what it saved", () => {
  const store = newMemoryBatchedRewardRuleQuotaStore();
  const item = newBatchedRewardRuleQuota("code-700", "title-795");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
