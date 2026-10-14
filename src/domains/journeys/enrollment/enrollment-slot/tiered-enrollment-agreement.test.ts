import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredEnrollmentAgreement } from "./tiered-enrollment-agreement.js";

test("TieredEnrollmentAgreement starts in draft", () => {
  const item = newTieredEnrollmentAgreement("code-649", "label-500");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredEnrollmentAgreement moves to suspended", () => {
  const item = newTieredEnrollmentAgreement("code-649", "label-500");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("TieredEnrollmentAgreement rejects moves from closed", () => {
  const item = newTieredEnrollmentAgreement("code-649", "label-500");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
