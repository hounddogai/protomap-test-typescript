import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentPolicy } from "./enrollment-policy.js";

test("EnrollmentPolicy starts in open", () => {
  const item = newEnrollmentPolicy("code-952", "name-356");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentPolicy moves to reopened", () => {
  const item = newEnrollmentPolicy("code-952", "name-356");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("EnrollmentPolicy rejects moves from archived", () => {
  const item = newEnrollmentPolicy("code-952", "name-356");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
