import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedRewardRulePreferenceStore } from "./weighted-reward-rule-preference-store.js";
import { newWeightedRewardRulePreference } from "./weighted-reward-rule-preference.js";

test("MemoryWeightedRewardRulePreferenceStore finds what it saved", () => {
  const store = newMemoryWeightedRewardRulePreferenceStore();
  const item = newWeightedRewardRulePreference("code-281", "title-374");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
