import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedRewardRuleOverrideStore } from "./batched-reward-rule-override-store.js";
import { newBatchedRewardRuleOverride } from "./batched-reward-rule-override.js";

test("MemoryBatchedRewardRuleOverrideStore finds what it saved", () => {
  const store = newMemoryBatchedRewardRuleOverrideStore();
  const item = newBatchedRewardRuleOverride("code-46", "name-816");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
