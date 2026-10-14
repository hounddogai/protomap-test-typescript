import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySubscriptionRuleStore } from "./subscription-rule-store.js";
import { newSubscriptionRule } from "./subscription-rule.js";

test("MemorySubscriptionRuleStore finds what it saved", () => {
  const store = newMemorySubscriptionRuleStore();
  const item = newSubscriptionRule("code-272", "name-541");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
