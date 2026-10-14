import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictRewardRuleQuotaStore } from "./strict-reward-rule-quota-store.js";
import { newStrictRewardRuleQuota } from "./strict-reward-rule-quota.js";

test("MemoryStrictRewardRuleQuotaStore finds what it saved", () => {
  const store = newMemoryStrictRewardRuleQuotaStore();
  const item = newStrictRewardRuleQuota("code-260", "title-167");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
