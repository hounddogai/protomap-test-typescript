import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardRuleTargetStore } from "./reward-rule-target-store.js";
import { newRewardRuleTarget } from "./reward-rule-target.js";

test("MemoryRewardRuleTargetStore finds what it saved", () => {
  const store = newMemoryRewardRuleTargetStore();
  const item = newRewardRuleTarget("code-353", "label-202");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
