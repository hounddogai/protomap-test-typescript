import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualBidRuleAgreementStore } from "./manual-bid-rule-agreement-store.js";
import { newManualBidRuleAgreement } from "./manual-bid-rule-agreement.js";

test("MemoryManualBidRuleAgreementStore finds what it saved", () => {
  const store = newMemoryManualBidRuleAgreementStore();
  const item = newManualBidRuleAgreement("code-129", "name-922");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
