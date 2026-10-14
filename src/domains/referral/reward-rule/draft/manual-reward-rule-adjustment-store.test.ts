import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualRewardRuleAdjustmentStore } from "./manual-reward-rule-adjustment-store.js";
import { newManualRewardRuleAdjustment } from "./manual-reward-rule-adjustment.js";

test("MemoryManualRewardRuleAdjustmentStore finds what it saved", () => {
  const store = newMemoryManualRewardRuleAdjustmentStore();
  const item = newManualRewardRuleAdjustment("code-41", "name-793");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
