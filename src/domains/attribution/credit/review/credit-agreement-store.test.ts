import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreditAgreementStore } from "./credit-agreement-store.js";
import { newCreditAgreement } from "./credit-agreement.js";

test("MemoryCreditAgreementStore finds what it saved", () => {
  const store = newMemoryCreditAgreementStore();
  const item = newCreditAgreement("code-329", "label-818");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
