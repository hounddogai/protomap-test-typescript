import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardRuleAllocationStore } from "./reward-rule-allocation-store.js";
import { newRewardRuleAllocation } from "./reward-rule-allocation.js";

test("MemoryRewardRuleAllocationStore finds what it saved", () => {
  const store = newMemoryRewardRuleAllocationStore();
  const item = newRewardRuleAllocation("code-445", "label-266");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
