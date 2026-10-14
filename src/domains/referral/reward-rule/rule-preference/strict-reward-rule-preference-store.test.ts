import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictRewardRulePreferenceStore } from "./strict-reward-rule-preference-store.js";
import { newStrictRewardRulePreference } from "./strict-reward-rule-preference.js";

test("MemoryStrictRewardRulePreferenceStore finds what it saved", () => {
  const store = newMemoryStrictRewardRulePreferenceStore();
  const item = newStrictRewardRulePreference("code-235", "label-919");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
