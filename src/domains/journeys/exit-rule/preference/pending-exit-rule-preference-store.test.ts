import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingExitRulePreferenceStore } from "./pending-exit-rule-preference-store.js";
import { newPendingExitRulePreference } from "./pending-exit-rule-preference.js";

test("MemoryPendingExitRulePreferenceStore finds what it saved", () => {
  const store = newMemoryPendingExitRulePreferenceStore();
  const item = newPendingExitRulePreference("code-688", "name-516");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
