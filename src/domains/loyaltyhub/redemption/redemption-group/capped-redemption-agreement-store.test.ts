import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedRedemptionAgreementStore } from "./capped-redemption-agreement-store.js";
import { newCappedRedemptionAgreement } from "./capped-redemption-agreement.js";

test("MemoryCappedRedemptionAgreementStore finds what it saved", () => {
  const store = newMemoryCappedRedemptionAgreementStore();
  const item = newCappedRedemptionAgreement("code-326", "label-867");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
