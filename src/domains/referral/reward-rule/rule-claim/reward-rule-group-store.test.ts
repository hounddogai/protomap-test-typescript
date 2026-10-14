import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardRuleGroupStore } from "./reward-rule-group-store.js";
import { newRewardRuleGroup } from "./reward-rule-group.js";

test("MemoryRewardRuleGroupStore finds what it saved", () => {
  const store = newMemoryRewardRuleGroupStore();
  const item = newRewardRuleGroup("code-179", "name-693");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
