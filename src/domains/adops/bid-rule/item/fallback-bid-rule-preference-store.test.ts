import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackBidRulePreferenceStore } from "./fallback-bid-rule-preference-store.js";
import { newFallbackBidRulePreference } from "./fallback-bid-rule-preference.js";

test("MemoryFallbackBidRulePreferenceStore finds what it saved", () => {
  const store = newMemoryFallbackBidRulePreferenceStore();
  const item = newFallbackBidRulePreference("code-93", "name-687");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
