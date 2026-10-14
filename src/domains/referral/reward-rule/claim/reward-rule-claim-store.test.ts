import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardRuleClaimStore } from "./reward-rule-claim-store.js";
import { newRewardRuleClaim } from "./reward-rule-claim.js";

test("MemoryRewardRuleClaimStore finds what it saved", () => {
  const store = newMemoryRewardRuleClaimStore();
  const item = newRewardRuleClaim("code-826", "label-349");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
