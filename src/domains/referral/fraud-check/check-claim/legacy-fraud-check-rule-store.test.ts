import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyFraudCheckRuleStore } from "./legacy-fraud-check-rule-store.js";
import { newLegacyFraudCheckRule } from "./legacy-fraud-check-rule.js";

test("MemoryLegacyFraudCheckRuleStore finds what it saved", () => {
  const store = newMemoryLegacyFraudCheckRuleStore();
  const item = newLegacyFraudCheckRule("code-511", "title-556");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
