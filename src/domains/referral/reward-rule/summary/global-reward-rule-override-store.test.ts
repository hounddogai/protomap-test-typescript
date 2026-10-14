import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalRewardRuleOverrideStore } from "./global-reward-rule-override-store.js";
import { newGlobalRewardRuleOverride } from "./global-reward-rule-override.js";

test("MemoryGlobalRewardRuleOverrideStore finds what it saved", () => {
  const store = newMemoryGlobalRewardRuleOverrideStore();
  const item = newGlobalRewardRuleOverride("code-799", "name-886");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
