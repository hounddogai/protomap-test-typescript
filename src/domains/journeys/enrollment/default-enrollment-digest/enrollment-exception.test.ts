import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentException } from "./enrollment-exception.js";

test("EnrollmentException starts in proposed", () => {
  const item = newEnrollmentException("code-703", "label-895");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentException moves to withdrawn", () => {
  const item = newEnrollmentException("code-703", "label-895");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("EnrollmentException rejects moves from withdrawn", () => {
  const item = newEnrollmentException("code-703", "label-895");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
