import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredRewardRuleOverrideStore } from "./tiered-reward-rule-override-store.js";
import { newTieredRewardRuleOverride } from "./tiered-reward-rule-override.js";

test("MemoryTieredRewardRuleOverrideStore finds what it saved", () => {
  const store = newMemoryTieredRewardRuleOverrideStore();
  const item = newTieredRewardRuleOverride("code-556", "label-922");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
