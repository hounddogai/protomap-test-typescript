import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardRulePolicyStore } from "./reward-rule-policy-store.js";
import { newRewardRulePolicy } from "./reward-rule-policy.js";

test("MemoryRewardRulePolicyStore finds what it saved", () => {
  const store = newMemoryRewardRulePolicyStore();
  const item = newRewardRulePolicy("code-920", "label-761");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
