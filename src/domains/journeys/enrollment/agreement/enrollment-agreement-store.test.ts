import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEnrollmentAgreementStore } from "./enrollment-agreement-store.js";
import { newEnrollmentAgreement } from "./enrollment-agreement.js";

test("MemoryEnrollmentAgreementStore finds what it saved", () => {
  const store = newMemoryEnrollmentAgreementStore();
  const item = newEnrollmentAgreement("code-307", "name-723");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
