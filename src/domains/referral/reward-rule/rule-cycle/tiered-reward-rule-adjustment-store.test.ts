import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredRewardRuleAdjustmentStore } from "./tiered-reward-rule-adjustment-store.js";
import { newTieredRewardRuleAdjustment } from "./tiered-reward-rule-adjustment.js";

test("MemoryTieredRewardRuleAdjustmentStore finds what it saved", () => {
  const store = newMemoryTieredRewardRuleAdjustmentStore();
  const item = newTieredRewardRuleAdjustment("code-809", "title-334");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
