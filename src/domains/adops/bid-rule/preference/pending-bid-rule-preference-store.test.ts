import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingBidRulePreferenceStore } from "./pending-bid-rule-preference-store.js";
import { newPendingBidRulePreference } from "./pending-bid-rule-preference.js";

test("MemoryPendingBidRulePreferenceStore finds what it saved", () => {
  const store = newMemoryPendingBidRulePreferenceStore();
  const item = newPendingBidRulePreference("code-583", "label-592");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
