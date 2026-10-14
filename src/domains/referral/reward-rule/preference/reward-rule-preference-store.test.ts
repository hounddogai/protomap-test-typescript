import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardRulePreferenceStore } from "./reward-rule-preference-store.js";
import { newRewardRulePreference } from "./reward-rule-preference.js";

test("MemoryRewardRulePreferenceStore finds what it saved", () => {
  const store = newMemoryRewardRulePreferenceStore();
  const item = newRewardRulePreference("code-841", "name-288");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
