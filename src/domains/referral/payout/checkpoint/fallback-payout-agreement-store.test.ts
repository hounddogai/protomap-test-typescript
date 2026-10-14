import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackPayoutAgreementStore } from "./fallback-payout-agreement-store.js";
import { newFallbackPayoutAgreement } from "./fallback-payout-agreement.js";

test("MemoryFallbackPayoutAgreementStore finds what it saved", () => {
  const store = newMemoryFallbackPayoutAgreementStore();
  const item = newFallbackPayoutAgreement("code-865", "label-953");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
