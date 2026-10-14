import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictBidRuleAgreementStore } from "./strict-bid-rule-agreement-store.js";
import { newStrictBidRuleAgreement } from "./strict-bid-rule-agreement.js";

test("MemoryStrictBidRuleAgreementStore finds what it saved", () => {
  const store = newMemoryStrictBidRuleAgreementStore();
  const item = newStrictBidRuleAgreement("code-960", "label-476");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
