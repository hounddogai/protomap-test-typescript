import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredExitRuleAgreementStore } from "./tiered-exit-rule-agreement-store.js";
import { newTieredExitRuleAgreement } from "./tiered-exit-rule-agreement.js";

test("MemoryTieredExitRuleAgreementStore finds what it saved", () => {
  const store = newMemoryTieredExitRuleAgreementStore();
  const item = newTieredExitRuleAgreement("code-309", "name-275");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
