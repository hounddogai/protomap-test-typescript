import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacySubscriptionRuleStore } from "./legacy-subscription-rule-store.js";
import { newLegacySubscriptionRule } from "./legacy-subscription-rule.js";

test("MemoryLegacySubscriptionRuleStore finds what it saved", () => {
  const store = newMemoryLegacySubscriptionRuleStore();
  const item = newLegacySubscriptionRule("code-791", "title-147");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
