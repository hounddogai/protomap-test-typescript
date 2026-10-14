import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledFraudCheckRuleStore } from "./scheduled-fraud-check-rule-store.js";
import { newScheduledFraudCheckRule } from "./scheduled-fraud-check-rule.js";

test("MemoryScheduledFraudCheckRuleStore finds what it saved", () => {
  const store = newMemoryScheduledFraudCheckRuleStore();
  const item = newScheduledFraudCheckRule("code-349", "name-879");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
