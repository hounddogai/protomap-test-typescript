import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledRewardRulePolicyStore } from "./scheduled-reward-rule-policy-store.js";
import { newScheduledRewardRulePolicy } from "./scheduled-reward-rule-policy.js";

test("MemoryScheduledRewardRulePolicyStore finds what it saved", () => {
  const store = newMemoryScheduledRewardRulePolicyStore();
  const item = newScheduledRewardRulePolicy("code-874", "label-466");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
