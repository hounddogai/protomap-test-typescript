import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalRewardRuleRollupStore } from "./global-reward-rule-rollup-store.js";
import { newGlobalRewardRuleRollup } from "./global-reward-rule-rollup.js";

test("MemoryGlobalRewardRuleRollupStore finds what it saved", () => {
  const store = newMemoryGlobalRewardRuleRollupStore();
  const item = newGlobalRewardRuleRollup("code-806", "title-813");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
