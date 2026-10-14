import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardRuleBaselineStore } from "./reward-rule-baseline-store.js";
import { newRewardRuleBaseline } from "./reward-rule-baseline.js";

test("MemoryRewardRuleBaselineStore finds what it saved", () => {
  const store = newMemoryRewardRuleBaselineStore();
  const item = newRewardRuleBaseline("code-989", "name-112");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
