import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryExitRuleAgreementStore } from "./primary-exit-rule-agreement-store.js";
import { newPrimaryExitRuleAgreement } from "./primary-exit-rule-agreement.js";

test("MemoryPrimaryExitRuleAgreementStore finds what it saved", () => {
  const store = newMemoryPrimaryExitRuleAgreementStore();
  const item = newPrimaryExitRuleAgreement("code-137", "label-569");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
