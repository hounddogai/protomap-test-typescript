import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptivePayoutAgreementStore } from "./adaptive-payout-agreement-store.js";
import { newAdaptivePayoutAgreement } from "./adaptive-payout-agreement.js";

test("MemoryAdaptivePayoutAgreementStore finds what it saved", () => {
  const store = newMemoryAdaptivePayoutAgreementStore();
  const item = newAdaptivePayoutAgreement("code-463", "title-551");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
