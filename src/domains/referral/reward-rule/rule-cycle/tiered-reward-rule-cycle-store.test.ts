import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredRewardRuleCycleStore } from "./tiered-reward-rule-cycle-store.js";
import { newTieredRewardRuleCycle } from "./tiered-reward-rule-cycle.js";

test("MemoryTieredRewardRuleCycleStore finds what it saved", () => {
  const store = newMemoryTieredRewardRuleCycleStore();
  const item = newTieredRewardRuleCycle("code-821", "name-652");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
