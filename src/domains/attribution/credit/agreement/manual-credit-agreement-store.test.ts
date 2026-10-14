import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualCreditAgreementStore } from "./manual-credit-agreement-store.js";
import { newManualCreditAgreement } from "./manual-credit-agreement.js";

test("MemoryManualCreditAgreementStore finds what it saved", () => {
  const store = newMemoryManualCreditAgreementStore();
  const item = newManualCreditAgreement("code-82", "title-336");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
