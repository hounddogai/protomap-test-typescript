import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingRewardRuleAdjustmentStore } from "./pending-reward-rule-adjustment-store.js";
import { newPendingRewardRuleAdjustment } from "./pending-reward-rule-adjustment.js";

test("MemoryPendingRewardRuleAdjustmentStore finds what it saved", () => {
  const store = newMemoryPendingRewardRuleAdjustmentStore();
  const item = newPendingRewardRuleAdjustment("code-970", "label-381");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
