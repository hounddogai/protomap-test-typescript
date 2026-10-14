import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentProfile } from "./enrollment-profile.js";

test("EnrollmentProfile starts in planned", () => {
  const item = newEnrollmentProfile("code-662", "name-397");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentProfile moves to cancelled", () => {
  const item = newEnrollmentProfile("code-662", "name-397");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("EnrollmentProfile rejects moves from cancelled", () => {
  const item = newEnrollmentProfile("code-662", "name-397");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
