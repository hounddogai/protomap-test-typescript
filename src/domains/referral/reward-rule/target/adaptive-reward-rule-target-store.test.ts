import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveRewardRuleTargetStore } from "./adaptive-reward-rule-target-store.js";
import { newAdaptiveRewardRuleTarget } from "./adaptive-reward-rule-target.js";

test("MemoryAdaptiveRewardRuleTargetStore finds what it saved", () => {
  const store = newMemoryAdaptiveRewardRuleTargetStore();
  const item = newAdaptiveRewardRuleTarget("code-773", "title-78");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
