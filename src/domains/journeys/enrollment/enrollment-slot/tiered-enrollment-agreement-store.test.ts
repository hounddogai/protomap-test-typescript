import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredEnrollmentAgreementStore } from "./tiered-enrollment-agreement-store.js";
import { newTieredEnrollmentAgreement } from "./tiered-enrollment-agreement.js";

test("MemoryTieredEnrollmentAgreementStore finds what it saved", () => {
  const store = newMemoryTieredEnrollmentAgreementStore();
  const item = newTieredEnrollmentAgreement("code-649", "label-500");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
