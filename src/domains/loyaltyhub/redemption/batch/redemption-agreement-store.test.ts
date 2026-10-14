import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRedemptionAgreementStore } from "./redemption-agreement-store.js";
import { newRedemptionAgreement } from "./redemption-agreement.js";

test("MemoryRedemptionAgreementStore finds what it saved", () => {
  const store = newMemoryRedemptionAgreementStore();
  const item = newRedemptionAgreement("code-115", "label-735");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
