import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentTier } from "./enrollment-tier.js";

test("EnrollmentTier starts in proposed", () => {
  const item = newEnrollmentTier("code-261", "title-87");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentTier moves to approved", () => {
  const item = newEnrollmentTier("code-261", "title-87");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("EnrollmentTier rejects moves from withdrawn", () => {
  const item = newEnrollmentTier("code-261", "title-87");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
